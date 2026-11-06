// Elinkeinoelämän kuljetukset kartalla: teollisuuden rekat, ruokakuljetukset, satamaliikenne ja henkilöautot.
// Sijainnit ovat karkeita. Vt 12:n osuudella nopeus riippuu vuoden liikennemäärästä ja kaistamäärästä.
(function () {
  const { BRAND, Path, baseMap, vt12Path, lerp, ellipse, reducedMotion } = window.MapKit;
  const GROWTH = '#C98A00';
  const T = window.TRAFFIC;

  const V0 = 520;            // m/s simulaatiossa
  const YEARS_PER_SEC = 0.5;

  // Paikat ja reitit OpenStreetMapista (data/roads.js, tools/build_roads.js).
  const R = window.ROADS;
  const P = Object.assign({
    tampere: [61.4978, 23.7610],
    west: [61.5030, 23.6400]
  }, R.places);
  const EAST = R.routes.vt12_east;
  P.east = EAST[Math.round(EAST.length * 0.6)];

  const PLACES = [
    { at: P.tarastenjarvi, name: 'Tarastenjärvi', kind: 'industry' },
    { at: P.rusko, name: 'Rusko', kind: 'industry' },
    { at: P.lentola, name: 'Lentola', kind: 'industry' },
    { at: P.kallio, name: 'Kallio', kind: 'industry' },
    { at: P.saarenmaa, name: 'Saarenmaa (tuleva)', kind: 'future' },
    { at: P.lamminrahka, name: 'Lamminrahka–Ojala (12 000 as.)', kind: 'growth' },
    { at: P.sahalahti, name: 'Sahalahti – Saarioinen', kind: 'food' },
    { at: P.tampere, name: 'Tampere', kind: 'city' },
    { at: P.kangasala, name: 'Kangasala', kind: 'city' }
  ];

  function init(root) {
    const map = baseMap(root.querySelector('.sim-map'));
    const vt = vt12Path();
    const J = T.junctions.map(j => vt.project(j.lat, j.lng));
    const sStart = 0, sEnd = vt.length;
    const projStart = J[0], projEnd = J[7];

    // Reitin osat:
    //  [lat,lng]            yksittäinen piste
    //  {vt:[s0,s1]}         vt 12 -linjaa pitkin; null = jatka edellisestä / seuraavaan osaan
    //  {osm:key, a, b}      OSM-reitti ROADS.routes[key]; a/b = 'start' | 'end' | 'prev' | 'next'
    function firstLL(part) { return Array.isArray(part) ? part : part.ll[0]; }
    function lastLL(part) { return Array.isArray(part) ? part : part.ll[part.ll.length - 1]; }
    function resolve(parts) {
      const out = parts.map(p => Array.isArray(p) ? p : p.vt ? { vt: p.vt.slice() } : Object.assign({}, p, { path: new Path(R.routes[p.osm]) }));
      const pos = (p, v, other) => v === 'start' ? 0 : v === 'end' ? p.path.length : p.path.project(other[0], other[1]);
      // 2) Kiinteät osat ensin, sitten vt-osat ja viittaukset naapureihin.
      out.forEach(p => { if (p.osm && !/prev|next/.test(p.a + p.b)) p.ll = p.path.slice(pos(p, p.a || 'start'), pos(p, p.b || 'end')); });
      out.forEach((p, i) => {
        if (!p.vt) return;
        const s0 = p.vt[0] !== null ? p.vt[0] : vt.project(...lastLL(out[i - 1]));
        const s1 = p.vt[1] !== null ? p.vt[1] : vt.project(...firstLL(out[i + 1]));
        p.ll = vt.slice(s0, s1); p.onVt = true;
      });
      out.forEach((p, i) => {
        if (!p.osm || p.ll) return;
        const ref = v => v === 'prev' ? lastLL(out[i - 1]) : v === 'next' ? firstLL(out[i + 1]) : null;
        p.ll = p.path.slice(pos(p, p.a || 'start', ref(p.a)), pos(p, p.b || 'end', ref(p.b)));
      });
      return out;
    }
    function route(rawParts) {
      const parts = resolve(rawParts).map(p => Array.isArray(p) ? p : (p.onVt ? { vtll: p.ll } : p.ll));
      const ll = [];
      const onVt = [];
      let d = 0;
      let prev = null;
      const add = (p, vtFlag) => {
        if (prev) {
          const seg = new Path([prev, p]).length;
          if (vtFlag) onVt.push([d, d + seg]);
          d += seg;
        }
        ll.push(p); prev = p;
      };
      parts.forEach(part => {
        if (Array.isArray(part) && typeof part[0] === 'number') add(part, false);
        else if (Array.isArray(part)) part.forEach(p => add(p, false));
        else {
          part.vtll.forEach((p, i) => {
            // Merkitään vt 12 -hankeosuudelle osuvat pätkät.
            const s = vt.project(p[0], p[1]);
            const inProject = s >= projStart - 50 && s <= projEnd + 50;
            add(p, i > 0 && inProject);
          });
        }
      });
      const path = new Path(ll);
      // Yhdistä peräkkäiset vt-välit.
      const merged = [];
      onVt.forEach(r => { const m = merged[merged.length - 1]; if (m && r[0] - m[1] < 1) m[1] = r[1]; else merged.push(r.slice()); });
      return { path, onVt: merged };
    }
    const flip = v => ({ prev: 'next', next: 'prev' })[v] || v;
    const revPart = p => Array.isArray(p) ? p : p.vt ? { vt: [p.vt[1], p.vt[0]] } : Object.assign({}, p, { a: flip(p.b || 'end'), b: flip(p.a || 'start') });
    const both = (def) => [def, Object.assign({}, def, { parts: def.parts.slice().reverse().map(revPart) })];

    // OSM-reitit (paikka → rampit → vt 12). Takaperin: { osm, a: 'end', b: 'start' } = vt 12:lta paikkaan.
    const from = key => ({ osm: key });
    const to = key => ({ osm: key, a: 'end', b: 'start' });
    const VT = { vt: [null, null] };   // vt 12 edellisen ja seuraavan osan välillä
    // Kehä II:n tulevat jatkeet (ei vielä tieverkossa, piirretty karkeasti).
    const ke2East = [[61.4900, 23.9620], [61.5100, 23.9500], [61.5300, 23.9300]];
    const ke2South = [[61.4580, 23.9580], [61.4660, 23.9750]];

    const defs = [
      // Teollisuuden rekat
      ...both({ layer: 'industry', color: BRAND.orange, rate: 0.9, truck: true,
        parts: [from('tarastenjarvi_vt12'), VT, to('lentola_vt12')] }),
      ...both({ layer: 'industry', color: BRAND.orange, rate: 0.6, truck: true,
        parts: [from('rusko_vt12'), VT, to('kallio_vt12')] }),
      ...both({ layer: 'industry', color: BRAND.orange, rate: 0.5, truck: true,
        parts: [from('kallio_vt12'), { vt: [null, sStart] }, P.tampere, P.west] }),
      // Tuleva Saarenmaa ja Kehä II
      ...both({ layer: 'future', color: BRAND.orange, rate: 0.5, truck: true, from: 2032,
        parts: [P.saarenmaa, ...ke2South, P.lentola] }),
      ...both({ layer: 'future', color: BRAND.orange, rate: 0.4, truck: true, from: 2035,
        parts: [from('lentola_vt12'), { vt: [null, J[3]] }, ...ke2East, P.tarastenjarvi] }),
      // Ruokakuljetukset Sahalahdelta: Sahalahdentie → Huutijärven etl → vt 12
      { layer: 'food', color: BRAND.green, rate: 0.7, truck: true,
        parts: [from('sahalahti_vt12'), VT, to('tarastenjarvi_vt12')] },
      ...both({ layer: 'food', color: BRAND.green, rate: 0.7, truck: true,
        parts: [from('sahalahti_vt12'), { vt: [null, sStart] }, P.tampere, P.west] }),
      // Satamakuljetukset Rauma–Kouvola: vt 12 jatkuu Huutijärveltä Lahden suuntaan
      ...both({ layer: 'port', color: BRAND.yellow, rate: 0.6, truck: true,
        parts: [P.west, P.tampere, { vt: [sStart, sEnd] }, { osm: 'vt12_east', a: 'prev', b: 'end' }] }),
      // Lamminrahka–Ojala: kasvava asuinalue, liikenne Lamminrahkan etl:n kautta (kasvaa rakentumisen myötä)
      ...both({ layer: 'growth', color: GROWTH, rate: 1.4, truck: false, ramp: true,
        parts: [from('lamminrahka_vt12'), { vt: [null, sStart] }, P.tampere] }),
      ...both({ layer: 'growth', color: GROWTH, rate: 0.9, truck: false, ramp: true,
        parts: [from('lamminrahka_vt12'), VT, to('kangasala_vt12')] }),
      ...both({ layer: 'growth', color: GROWTH, rate: 0.35, truck: true, ramp: true,
        parts: [from('lamminrahka_vt12'), VT, to('kallio_vt12')] }),
      // Henkilöautot
      ...both({ layer: 'cars', color: BRAND.navy, rate: 3.2, truck: false,
        parts: [P.tampere, { vt: [sStart, sEnd] }, { osm: 'vt12_east', a: 'prev', b: 'end' }] }),
      ...both({ layer: 'cars', color: BRAND.navy, rate: 1.6, truck: false,
        parts: [P.tampere, { vt: [sStart, null] }, to('kangasala_vt12')] }),
      ...both({ layer: 'cars', color: BRAND.navy, rate: 0.8, truck: false,
        parts: [from('rusko_vt12'), VT, to('lentola_vt12')] })
    ];
    const routes = defs.map(d => Object.assign({}, d, route(d.parts), { acc: Math.random() }));

    // --- Kartan tasot --------------------------------------------------------
    const groups = { industry: L.layerGroup(), food: L.layerGroup(), port: L.layerGroup(), cars: L.layerGroup(), future: L.layerGroup(), growth: L.layerGroup() };
    L.polygon(ellipse(P.lamminrahka[0], P.lamminrahka[1], 1200, 750, 15), { color: GROWTH, weight: 2, dashArray: '6 5', fillColor: BRAND.yellow, fillOpacity: 0.25, interactive: false }).addTo(groups.growth);
    L.polyline(vt.latlngs, { color: '#374151', weight: 7, opacity: 0.5 }).addTo(map);
    const projLine = L.polyline(vt.slice(projStart, projEnd), { color: BRAND.red, weight: 5, opacity: 0.85 }).addTo(map)
      .bindTooltip('Vt 12 Alasjärvi–Huutijärvi', { sticky: true });
    routes.forEach(r => {
      if (r.layer === 'cars') return;
      const dashed = r.layer === 'future';
      L.polyline(r.path.latlngs, { color: r.color, weight: dashed ? 3 : 2.5, opacity: 0.5, dashArray: dashed ? '6 6' : null, interactive: false }).addTo(groups[r.layer]);
    });
    // Kehä II tulevat jatkeet
    L.polyline([P.lentola, ...ke2South.slice().reverse(), P.saarenmaa, P.rusko], { color: BRAND.red, weight: 3, dashArray: '2 7', lineCap: 'round' })
      .bindTooltip('Kehä II Rusko–Lentola (tuleva)').addTo(groups.future);
    L.polyline([vt.at(J[3]).slice(0, 2), ...ke2East, P.tarastenjarvi], { color: BRAND.red, weight: 3, dashArray: '2 7', lineCap: 'round' })
      .bindTooltip('Kehä II Lentola–Tarastenjärvi (tuleva)').addTo(groups.future);
    // Satamasuunnat
    [[P.west, 'Rauma · Pori · satamat', 'left'], [P.east, 'Lahti · Kouvola · HaminaKotka', 'right']].forEach(([at, txt, dir]) => {
      L.marker(at, { icon: L.divIcon({ className: 'edge-arrow edge-arrow--' + dir, html: `<span>${txt}</span>`, iconSize: null }) }).addTo(groups.port);
    });
    Object.values(groups).forEach(g => g.addTo(map));

    PLACES.forEach(p => {
      const color = { industry: BRAND.orange, food: BRAND.green, future: BRAND.orange, city: BRAND.navy, growth: GROWTH }[p.kind];
      L.circleMarker(p.at, { radius: p.kind === 'city' ? 5 : 7, color: '#fff', weight: 2, fillColor: color, fillOpacity: p.kind === 'future' ? 0.55 : 1 })
        .bindTooltip(p.name, { permanent: true, direction: p.kind === 'food' ? 'left' : 'right', offset: [p.kind === 'food' ? -8 : 8, 0], className: 'place-label place-label--' + p.kind })
        .addTo(map);
    });

    map.fitBounds(L.latLngBounds([P.tarastenjarvi, P.sahalahti, P.tampere, P.east, [61.445, 23.88]]), { padding: [10, 10] });

    // --- Tila -------------------------------------------------------------
    const state = { year: T.startYear, playing: false, four: false, layers: { industry: true, food: true, port: true, cars: true, future: true, growth: true } };
    const t01 = () => (state.year - T.startYear) / (T.endYear - T.startYear);
    const vtLoad = () => {
      const segs = T.segments.slice(1, 8);
      const kvl = segs.reduce((a, s) => a + lerp(s.now[0], s.f2050[0], t01()), 0) / segs.length;
      return kvl / (state.four ? T.capacity22 : T.capacity11);
    };
    const vtF = () => {
      const l = vtLoad();
      return l <= 0.85 ? 1 : Math.max(0.12, 1 / (1 + 2.2 * Math.pow(l - 0.85, 1.3)));
    };

    let vehicles = [];
    function step(dt) {
      const growth = lerp(1, 1.6, t01());
      const f = vtF();
      routes.forEach(r => {
        if (!state.layers[r.layer]) return;
        if (r.from && state.year < r.from) return;
        r.acc += dt * r.rate * growth * (r.ramp ? lerp(0.2, 1, t01()) : 1);
        while (r.acc >= 1) { r.acc -= 1; vehicles.push({ r, d: 0 }); }
      });
      vehicles.forEach(v => {
        const onVt = v.r.onVt.some(([a, b]) => v.d >= a && v.d <= b);
        let sp = V0 * (v.r.truck ? 0.9 : 1);
        if (onVt) sp *= f * (state.four ? 1 : (0.55 + 0.9 * (0.5 + 0.5 * Math.sin(v.d / 500 - performance.now() / 600))));
        v.d += sp * dt;
      });
      vehicles = vehicles.filter(v => v.d < v.r.path.length && state.layers[v.r.layer] && !(v.r.from && state.year < v.r.from));
    }

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
    resize(); map.on('resize', resize);

    function draw() {
      const r = map.getContainer().getBoundingClientRect();
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
      ctx.clearRect(0, 0, r.width, r.height);
      const k = Math.max(0.8, Math.min(1.8, (map.getZoom() - 9) / 2));
      vehicles.forEach(v => {
        const p = v.r.path.at(v.d);
        const pt = map.latLngToContainerPoint([p[0], p[1]]);
        const dx = Math.cos(p[2]), dy = -Math.sin(p[2]);
        const x = pt.x - dy * 2.5 * k, y = pt.y + dx * 2.5 * k;   // oikea ajokaista
        ctx.fillStyle = v.r.color;
        if (v.r.truck) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx));
          ctx.fillRect(-3.5 * k, -1.6 * k, 7 * k, 3.2 * k);
          ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.6; ctx.strokeRect(-3.5 * k, -1.6 * k, 7 * k, 3.2 * k);
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(x, y, 1.5 * k, 0, Math.PI * 2); ctx.fill();
        }
      });
    }

    // --- Ohjaimet -----------------------------------------------------------
    const ui = {
      year: root.querySelector('[data-biz=year]'),
      slider: root.querySelector('[data-biz=slider]'),
      play: root.querySelector('[data-biz=play]'),
      four: root.querySelector('[data-biz=four]'),
      status: root.querySelector('[data-biz=status]')
    };
    function refresh() {
      ui.year.textContent = Math.floor(state.year);
      ui.slider.value = state.year;
      const f = vtF();
      projLine.setStyle({ color: state.four ? BRAND.green : BRAND.red, weight: state.four ? 9 : 5 });
      ui.status.className = 'sim-status ' + (state.four ? 'is-good' : 'is-bad');
      ui.status.textContent = state.four
        ? 'Vt 12 nelikaistainen – kuljetukset kulkevat sujuvasti'
        : `Vt 12 kaksikaistainen – ruuhka hidastaa kuljetuksia (nopeus noin ${Math.round(f * 100)} % sujuvasta)`;
    }
    function setPlaying(p) {
      state.playing = p;
      if (p && state.year >= T.endYear) state.year = T.startYear;
      ui.play.textContent = p ? 'Pysäytä' : 'Käynnistä';
      ui.play.setAttribute('aria-pressed', p);
    }
    ui.play.addEventListener('click', () => setPlaying(!state.playing));
    ui.slider.addEventListener('input', () => { setPlaying(false); state.year = +ui.slider.value; refresh(); });
    ui.four.addEventListener('change', () => { state.four = ui.four.checked; refresh(); });
    root.querySelectorAll('[data-layer]').forEach(cb => cb.addEventListener('change', () => {
      state.layers[cb.dataset.layer] = cb.checked;
      cb.checked ? groups[cb.dataset.layer].addTo(map) : groups[cb.dataset.layer].remove();
    }));

    let last = performance.now(), visible = false, autostarted = false;
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (visible) {
        if (state.playing) {
          const before = Math.floor(state.year);
          state.year = Math.min(T.endYear, state.year + dt * YEARS_PER_SEC);
          if (Math.floor(state.year) !== before) refresh();
          if (state.year >= T.endYear) setPlaying(false);
        }
        if (!reducedMotion) step(dt);
        draw();
      }
      requestAnimationFrame(loop);
    }
    refresh();
    for (let i = 0; i < 400; i++) step(0.05);
    requestAnimationFrame(loop);
    new IntersectionObserver(es => es.forEach(e => {
      visible = e.isIntersecting;
      if (visible) { map.invalidateSize(); resize(); }
      if (visible && !autostarted && !reducedMotion && !window.SNAPSHOT_MODE) { autostarted = true; setPlaying(true); }
    }), { threshold: 0.25 }).observe(root);

    window.SimBusiness = {
      set: (year, four) => { setPlaying(false); state.year = year; state.four = four; ui.four.checked = four; refresh(); for (let i = 0; i < 400; i++) step(0.05); draw(); },
      map
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('simulaatio-elinkeino');
    if (root) init(root);
  });
})();
