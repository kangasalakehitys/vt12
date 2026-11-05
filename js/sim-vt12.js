// Vt 12 -liikennesimulaatio 2026–2050.
// Autot ovat pisteitä, joiden tiheys seuraa osuuden liikennemäärää. Kaksikaistaisella tiellä
// nopeus putoaa kuormitusasteen mukaan ja autot jonoutuvat; nelikaistaisella ne jakautuvat kahdelle kaistalle.
(function () {
  const { BRAND, Path, offsetLL, baseMap, vt12Path, fmt, lerp, reducedMotion } = window.MapKit;
  const T = window.TRAFFIC;

  const V0 = 380;          // vapaan liikenteen nopeus simulaatiossa, m/s
  const GAP = 105;         // pienin väli autojen välillä, m
  const DIVISOR = 1500;    // ajon./vrk per suunta → autoja / km
  const YEARS_PER_SEC = 0.6;
  const TRUCK_JAM = '#00FFFF';  // rekka ruuhkassa

  function el(id) { return document.getElementById(id); }

  function speedFactor(load) {
    if (load <= 0.85) return 1;
    return Math.max(0.1, 1 / (1 + 2.2 * Math.pow(load - 0.85, 1.3)));
  }
  function loadColor(load, four) {
    if (four) return load < 0.85 ? BRAND.green : BRAND.yellow;
    if (load < 0.85) return BRAND.green;
    if (load < 1.25) return BRAND.yellow;
    if (load < 2) return BRAND.orange;
    return BRAND.red;
  }

  function init(root) {
    const mapEl = root.querySelector('.sim-map');
    const map = baseMap(mapEl, { zoomSnap: 0.25 });
    const path = vt12Path();

    // --- Liittymät ja osuudet linjalle -----------------------------------
    const J = T.junctions.map(j => {
      const s = path.project(j.lat, j.lng);
      const p = path.at(s);
      const branches = j.branches.map(b => {
        const end = offsetLL(p[0], p[1], b.bearing, b.len);
        return Object.assign({}, b, { path: new Path([[p[0], p[1]], end]) });
      });
      return Object.assign({}, j, { s, ll: [p[0], p[1]], branches });
    });
    const S = T.segments.map(seg => {
      const s0 = seg.from < 0 ? 0 : J[seg.from].s;
      const s1 = seg.to >= J.length ? path.length : J[seg.to].s;
      return Object.assign({}, seg, { s0, s1, len: s1 - s0 });
    });
    const segAt = s => { for (let i = 0; i < S.length; i++) if (s < S[i].s1) return i; return S.length - 1; };

    const bounds = L.latLngBounds(path.latlngs);
    const fit = () => map.fitBounds(bounds, { padding: [20, 20] });
    fit();

    // --- Tasot ------------------------------------------------------------
    map.createPane('junctions'); map.getPane('junctions').style.zIndex = 520;
    map.createPane('labels'); map.getPane('labels').style.zIndex = 640;

    const casing = L.polyline(path.latlngs, { color: '#4b5563', weight: 9, opacity: 0.4, lineCap: 'round', interactive: false }).addTo(map);
    const segLines = S.map(seg => L.polyline(path.slice(seg.s0, seg.s1), { weight: 6, opacity: 0.45, lineCap: 'butt', interactive: false }).addTo(map));
    const branchLines = [];
    J.forEach(j => j.branches.forEach(b => {
      branchLines.push(L.polyline(b.path.latlngs, { color: '#6b7280', weight: 4, opacity: 0.6, interactive: false }).addTo(map));
    }));
    const jMarkers = J.map((j, i) => L.circleMarker(j.ll, {
      pane: 'junctions', radius: 7, color: '#fff', weight: 2.5, fillColor: BRAND.red, fillOpacity: 1
    }).addTo(map).bindPopup(() => junctionPopup(i), { maxWidth: 280 }));

    // Pysyvät numerotarrat (näkyvät tauolla tai kun valittu).
    const segLabels = S.map(seg => {
      const mid = path.at((seg.s0 + seg.s1) / 2);
      return L.tooltip({ permanent: true, direction: 'top', offset: [16, -10], className: 'sim-label sim-label--road', pane: 'labels' }).setLatLng([mid[0], mid[1]]);
    });
    const branchLabels = [];
    J.forEach(j => j.branches.forEach(b => {
      const end = b.path.latlngs[1];
      branchLabels.push(L.tooltip({ permanent: true, direction: 'center', className: 'sim-label sim-label--branch', pane: 'labels' }).setLatLng(end));
    }));
    const jLabels = J.map(j => L.tooltip({ permanent: true, direction: 'bottom', offset: [-8, 12], className: 'sim-label sim-label--junction', pane: 'labels' })
      .setLatLng(j.ll).setContent(j.name));

    // --- Tila ---------------------------------------------------------------
    const state = {
      year: T.startYear,
      playing: false,
      speed: 1,
      upgradeYear: 2030,
      labels: null,   // null = automaattinen (näkyy tauolla), true/false = käyttäjän valinta
      four: false
    };

    const t01 = () => (state.year - T.startYear) / (T.endYear - T.startYear);
    const val = (o) => [lerp(o.now[0], o.f2050[0], t01()), lerp(o.now[1], o.f2050[1], t01())];
    const isFour = () => state.upgradeYear !== null && Math.floor(state.year) >= state.upgradeYear;
    const cap = () => isFour() ? T.capacity22 : T.capacity11;

    // --- Ajoneuvot ----------------------------------------------------------
    let cars = [];       // pääväylä
    let bcars = [];      // liittymähaarat
    let simT = 0;

    function segTargets() {
      return S.map(seg => {
        const [kvl, ras] = val(seg);
        const load = kvl / cap();
        const f = speedFactor(load);
        const lanes = isFour() ? 2 : 1;
        const flowDensity = (kvl / 2) / DIVISOR / 1000;            // autoa / m / suunta
        const jam = lanes / GAP;
        const density = Math.min(jam * 0.97, flowDensity / f);
        return { kvl, ras, load, f, n: Math.round(density * seg.len), truckP: ras / kvl };
      });
    }
    let targets = segTargets();

    function laneFree(s, dir, lane, list) {
      for (const c of list) if (c.dir === dir && c.lane === lane && Math.abs(c.s - s) < GAP) return false;
      return true;
    }

    function prefill() {
      cars = [];
      const lanes = isFour() ? 2 : 1;
      S.forEach((seg, i) => {
        const tg = targets[i];
        [1, -1].forEach(dir => {
          const n = tg.n;
          for (let k = 0; k < n; k++) {
            let tries = 0;
            while (tries++ < 12) {
              const s = seg.s0 + Math.random() * seg.len;
              const lane = Math.floor(Math.random() * lanes);
              if (laneFree(s, dir, lane, cars)) {
                cars.push(newCar(s, dir, lane, Math.random() < tg.truckP * 3));
                break;
              }
            }
          }
        });
      });
      bcars = [];
    }

    function newCar(s, dir, lane, truck) {
      return { s, dir, lane, off: lane, truck, v: V0 * 0.5, exit: false };
    }

    function step(dt) {
      simT += dt;
      const four = isFour();
      const lanes = four ? 2 : 1;

      // Ryhmittele kaistoittain, järjestä ajosuunnan mukaan.
      const groups = {};
      for (const c of cars) {
        if (c.lane >= lanes) c.lane = lanes - 1;
        const k = c.dir + ':' + c.lane;
        (groups[k] = groups[k] || []).push(c);
      }
      const leaderGap = {};
      for (const k in groups) {
        const g = groups[k];
        const dir = g[0].dir;
        g.sort((a, b) => dir > 0 ? b.s - a.s : a.s - b.s);   // edellä ajava ensin
        for (let i = 0; i < g.length; i++) {
          g[i]._gap = i === 0 ? Infinity : Math.abs(g[i - 1].s - g[i].s);
        }
      }

      // Kaistanvaihto nelikaistaisella.
      if (four) {
        for (const c of cars) {
          if (c._gap < GAP * 2.2 && Math.random() < 0.05) {
            const other = 1 - c.lane;
            let ok = true;
            for (const d of cars) {
              if (d !== c && d.dir === c.dir && d.lane === other && Math.abs(d.s - c.s) < GAP * 1.2) { ok = false; break; }
            }
            if (ok) c.lane = other;
          }
        }
      }

      for (const c of cars) {
        const si = segAt(c.s);
        const tg = targets[si];
        let desired = V0 * tg.f * (c.truck ? 0.85 : 1);
        if (!four && tg.load > 1) {
          // Pysähtele-ja-lähde -aallot ruuhkassa.
          const w = 0.5 + 0.5 * Math.sin(c.s / 520 * c.dir - simT * 1.6);
          desired *= 0.25 + 1.5 * w;
        }
        let v = desired;
        if (c._gap < GAP) v = 0;
        else if (c._gap < GAP * 2) v = Math.min(v, desired * (c._gap - GAP) / GAP);
        c.v += (v - c.v) * Math.min(1, dt * 4);
        const prevSeg = si;
        c.s += c.v * dt * c.dir;
        c.off += (c.lane - c.off) * Math.min(1, dt * 3);
        // Liittymän ohitus: poistu, jos seuraavalla osuudella on jo tarpeeksi autoja.
        const nsi = segAt(c.s);
        if (nsi !== prevSeg && counts[nsi + ':' + c.dir] >= targets[nsi].n) c.exit = true;
      }
      cars = cars.filter(c => !c.exit && c.s > 0 && c.s < path.length);

      // Täydennä osuuksia liittymistä.
      recount();
      S.forEach((seg, i) => {
        [1, -1].forEach(dir => {
          const missing = targets[i].n - (counts[i + ':' + dir] || 0);
          if (missing > 0) {
            const s = dir > 0 ? seg.s0 + 5 : seg.s1 - 5;
            const lane = Math.floor(Math.random() * lanes);
            if (laneFree(s, dir, lane, cars)) cars.push(newCar(s, dir, lane, Math.random() < targets[i].truckP * 3));
          }
        });
      });

      stepBranches(dt);
    }

    let counts = {};
    function recount() {
      counts = {};
      for (const c of cars) { const k = segAt(c.s) + ':' + c.dir; counts[k] = (counts[k] || 0) + 1; }
    }

    // Haarat: liittymää kohti tulevat jonoutuvat, jos pääväylä on tukossa.
    function stepBranches(dt) {
      J.forEach((j, ji) => {
        const leftSeg = Math.max(0, segAt(j.s - 10));
        const mainF = Math.min(targets[leftSeg].f, targets[Math.min(S.length - 1, leftSeg + 1)].f);
        j.branches.forEach((b, bi) => {
          const [kvl] = val(b);
          const len = b.path.length;
          const flowD = (kvl / 2) / DIVISOR / 1000;
          const target = Math.max(1, Math.round(Math.min(1 / GAP, flowD / Math.max(0.25, mainF)) * len));
          const mine = bcars.filter(c => c.j === ji && c.b === bi);
          [1, -1].forEach(dir => {     // 1 = liittymästä poispäin, -1 = liittymään päin
            const list = mine.filter(c => c.dir === dir).sort((a, b2) => dir > 0 ? b2.t - a.t : a.t - b2.t);
            for (let i = 0; i < list.length; i++) {
              const c = list[i];
              const gap = i === 0 ? Infinity : Math.abs(list[i - 1].t - c.t);
              let v = V0 * 0.45;
              if (gap < GAP * 0.8) v = 0;
              if (dir < 0 && c.t < GAP * 0.6) {
                // Pääsee pääväylälle vain, jos siellä on tilaa.
                if (Math.random() < dt * 2.5 * mainF) c.done = true; else v = 0;
              }
              c.t += v * dt * dir;
              if (c.t > len) c.done = true;
            }
            if (list.length < target) {
              const startT = dir > 0 ? 2 : len - 2;
              if (!list.some(c => Math.abs(c.t - startT) < GAP * 0.8)) bcars.push({ j: ji, b: bi, dir, t: startT });
            }
          });
        });
      });
      bcars = bcars.filter(c => !c.done);
    }

    // --- Piirto ------------------------------------------------------------
    const canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    // Autot omaan karttatasoonsa: tieviivojen yläpuolelle mutta tarrojen ja ponnahdusikkunoiden alle.
    map.createPane('cars'); map.getPane('cars').style.zIndex = 450; map.getPane('cars').style.pointerEvents = 'none';
    map.getPane('cars').appendChild(canvas);
    const ctx = canvas.getContext('2d');
    function resize() {
      const r = map.getContainer().getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    map.on('resize', resize);

    function draw() {
      const four = isFour();
      const z = map.getZoom();
      const k = Math.max(0.7, Math.min(1.8, (z - 10) / 2.2));
      const r = map.getContainer().getBoundingClientRect();
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
      ctx.clearRect(0, 0, r.width, r.height);
      const laneW = (four ? 3.6 : 2.6) * k;
      for (const c of cars) {
        const p = path.at(c.s);
        const pt = map.latLngToContainerPoint([p[0], p[1]]);
        // Kulkusuunta ruudulla (y alaspäin) ja oikeanpuoleinen normaali.
        const dx = Math.cos(p[2]) * c.dir, dy = -Math.sin(p[2]) * c.dir;
        const nx = -dy, ny = dx;
        const o = laneW * (0.9 + c.off * (four ? 1.05 : 0)) + (four ? 2 * k : 0);
        const x = pt.x + nx * o, y = pt.y + ny * o;
        if (c.truck) {
          // Rekka on cyan ruuhkaisella osuudella, oranssi sujuvassa liikenteessä.
          const jam = !four && targets[segAt(c.s)].load > 1;
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx));
          ctx.fillStyle = jam ? TRUCK_JAM : BRAND.orange; ctx.fillRect(-3.2 * k, -1.4 * k, 6.4 * k, 2.8 * k);
          if (jam) { ctx.strokeStyle = '#0b5563'; ctx.lineWidth = 0.7; ctx.strokeRect(-3.2 * k, -1.4 * k, 6.4 * k, 2.8 * k); }
          ctx.restore();
        } else {
          ctx.fillStyle = BRAND.navy;
          ctx.beginPath(); ctx.arc(x, y, 1.6 * k, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (const c of bcars) {
        const b = J[c.j].branches[c.b];
        const p = b.path.at(c.t);
        const pt = map.latLngToContainerPoint([p[0], p[1]]);
        const dx = Math.cos(p[2]) * c.dir, dy = -Math.sin(p[2]) * c.dir;
        const x = pt.x - dy * 2 * k, y = pt.y + dx * 2 * k;
        ctx.fillStyle = '#4b5563';
        ctx.beginPath(); ctx.arc(x, y, 1.4 * k, 0, Math.PI * 2); ctx.fill();
      }
    }

    // --- Käyttöliittymä -----------------------------------------------------
    const ui = {
      year: root.querySelector('[data-sim=year]'),
      slider: root.querySelector('[data-sim=slider]'),
      play: root.querySelector('[data-sim=play]'),
      speed: root.querySelector('[data-sim=speed]'),
      upgrade: root.querySelector('[data-sim=upgrade]'),
      never: root.querySelector('[data-sim=never]'),
      labels: root.querySelector('[data-sim=labels]'),
      status: root.querySelector('[data-sim=status]'),
      maxKvl: root.querySelector('[data-sim=maxkvl]'),
      load: root.querySelector('[data-sim=load]'),
      ras: root.querySelector('[data-sim=ras]'),
      flow: root.querySelector('[data-sim=flow]'),
      reset: root.querySelector('[data-sim=reset]')
    };

    let lastFour = null;
    function refresh() {
      targets = segTargets();
      const four = isFour();
      if (lastFour !== null && four !== lastFour && four) {
        // Uudet kaistat avautuvat: puolet autoista siirtyy vasemmalle kaistalle.
        cars.forEach(c => { if (Math.random() < 0.5) c.lane = 1; });
      }
      lastFour = four;

      const y = Math.floor(state.year);
      ui.year.textContent = y;
      ui.slider.value = y;
      ui.slider.setAttribute('aria-valuetext', y);
      const showNums = labelsOn();

      casing.setStyle({ weight: four ? 17 : 9 });
      S.forEach((seg, i) => {
        const tg = targets[i];
        segLines[i].setStyle({ color: loadColor(tg.load, four), weight: four ? 13 : (showNums ? 8 : 6), opacity: showNums ? 0.7 : 0.45 });
        segLabels[i].setContent(`<b>${fmt(tg.kvl)}</b><span>${fmt(tg.ras)}</span>`);
      });
      let bi = 0;
      J.forEach(j => j.branches.forEach(b => {
        const [kvl, ras] = val(b);
        branchLabels[bi++].setContent(`<b>${fmt(kvl)}</b><span>${fmt(ras)}</span>`);
      }));
      jMarkers.forEach(m => m.setRadius(showNums ? 9 : 7));

      const main = targets.slice(1, 8);
      const lens = S.slice(1, 8).map(x => x.len);
      const maxT = main.reduce((a, b) => b.kvl > a.kvl ? b : a);
      const avgF = main.reduce((a, b, i) => a + b.f * lens[i], 0) / lens.reduce((a, b) => a + b, 0);
      ui.maxKvl.textContent = fmt(maxT.kvl);
      ui.load.textContent = Math.round(maxT.load * 100) + ' %';
      ui.ras.textContent = fmt(Math.max(...main.map(t => t.ras)));
      ui.flow.textContent = Math.round(avgF * 100) + ' %';
      const loadBad = maxT.load > 1;
      ui.status.className = 'sim-status ' + (four ? 'is-good' : (loadBad ? 'is-bad' : 'is-ok'));
      ui.status.textContent = four
        ? 'Nelikaistainen 2+2 – liikenne sujuu'
        : (loadBad ? 'Kaksikaistainen 1+1 – tie ruuhkautuu' : 'Kaksikaistainen 1+1');

      showLabels(showNums);
      ui.labels.checked = showNums;
    }

    function labelsOn() { return state.labels === null ? !state.playing : state.labels; }
    let labelsShown = false;
    function showLabels(on) {
      if (on === labelsShown) return;
      labelsShown = on;
      [...segLabels, ...branchLabels, ...jLabels].forEach(t => on ? t.addTo(map) : t.remove());
      root.classList.toggle('is-paused', on);
    }

    function junctionPopup(i) {
      const j = J[i];
      const y = Math.floor(state.year);
      const rows = [];
      const segIn = S.find(s => s.to === i), segOut = S.find(s => s.from === i);
      const row = (label, o) => {
        const [k] = val(o);
        const ch = Math.round((k / o.now[0] - 1) * 100);
        rows.push(`<tr><td>${label}</td><td>${fmt(o.now[0])}</td><td><b>${fmt(k)}</b></td><td>${ch >= 0 ? '+' : ''}${ch} %</td></tr>`);
      };
      if (segIn) row('Vt 12 länteen', segIn);
      if (segOut) row('Vt 12 itään', segOut);
      j.branches.forEach((b, k) => row(`Liittyvä tie ${k + 1}`, b));
      return `<div class="sim-popup"><h4>${j.name}</h4><p>KVL ajon./vrk</p>
        <table><thead><tr><th></th><th>2026</th><th>${y}</th><th>muutos</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
    }

    function setYear(y) {
      state.year = Math.max(T.startYear, Math.min(T.endYear, y));
      refresh();
      jMarkers.forEach(m => m.isPopupOpen() && m.setPopupContent(junctionPopup(jMarkers.indexOf(m))));
    }
    function setPlaying(p) {
      state.playing = p;
      if (p && state.year >= T.endYear) state.year = T.startYear;
      ui.play.textContent = p ? 'Pysäytä' : 'Käynnistä';
      ui.play.setAttribute('aria-pressed', p);
      refresh();
    }

    ui.play.addEventListener('click', () => setPlaying(!state.playing));
    ui.slider.addEventListener('input', () => { const y = +ui.slider.value; setPlaying(false); setYear(y); });
    ui.speed.addEventListener('change', () => { state.speed = +ui.speed.value; });
    ui.upgrade.addEventListener('change', () => {
      const v = Math.max(2027, Math.min(2050, +ui.upgrade.value || 2030));
      ui.upgrade.value = v;
      if (!ui.never.checked) state.upgradeYear = v;
      refresh();
    });
    ui.never.addEventListener('change', () => {
      state.upgradeYear = ui.never.checked ? null : +ui.upgrade.value;
      ui.upgrade.disabled = ui.never.checked;
      refresh();
    });
    ui.labels.addEventListener('change', () => { state.labels = ui.labels.checked; refresh(); });
    root.querySelectorAll('[data-sim-step]').forEach(b => b.addEventListener('click', () => {
      setPlaying(false); setYear(Math.floor(state.year) + +b.dataset.simStep); prefill();
    }));
    ui.reset && ui.reset.addEventListener('click', fit);
    root.querySelectorAll('[data-sim-year]').forEach(b => b.addEventListener('click', () => {
      setPlaying(false); setYear(+b.dataset.simYear); prefill();
    }));

    // --- Silmukka -----------------------------------------------------------
    let last = performance.now();
    let visible = true;
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible) {
        if (state.playing) {
          const before = Math.floor(state.year);
          state.year = Math.min(T.endYear, state.year + dt * YEARS_PER_SEC * state.speed);
          if (Math.floor(state.year) !== before) refresh();
          if (state.year >= T.endYear) setPlaying(false);
        }
        if (!reducedMotion) step(dt * state.speed);
        draw();
      }
      requestAnimationFrame(loop);
    }

    refresh();
    prefill();
    for (let i = 0; i < 60; i++) step(0.05);
    requestAnimationFrame(loop);

    // Käynnistä automaattisesti, kun simulaatio tulee näkyviin ensimmäisen kerran.
    let autostarted = false;
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        visible = e.isIntersecting;
        if (visible) { map.invalidateSize(); resize(); }
        if (visible && !autostarted && !reducedMotion && !window.SNAPSHOT_MODE) { autostarted = true; setPlaying(true); }
      });
    }, { threshold: 0.25 }).observe(root);

    // Ohjaus Puppeteer-kuvakaappauksia varten.
    window.SimVT12 = {
      setYear: y => { setPlaying(false); setYear(y); prefill(); for (let i = 0; i < 80; i++) step(0.05); draw(); },
      setUpgrade: y => { state.upgradeYear = y; ui.never.checked = y === null; if (y) ui.upgrade.value = y; refresh(); },
      labels: on => { state.labels = on; ui.labels.checked = on; refresh(); },
      pause: () => setPlaying(false),
      map
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('simulaatio-vt12');
    if (root) init(root);
  });
})();
