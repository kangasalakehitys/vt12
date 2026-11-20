// Interaktiiviset kartat: kasvu ja hankekokonaisuus, ympäristö (melu, pyörätie, Natura, st 339) ja sotilaallinen liikkuvuus.
// Kohteiden rajaukset ovat karkeita ja perustuvat esittelymateriaalin karttakuviin.
(function () {
  const { BRAND, Path, offsetLL, ellipse, baseMap, vt12Path } = window.MapKit;
  const T = window.TRAFFIC;
  const R = window.ROADS;   // OSM-geometriat (data/roads.js)
  const JL = id => { const j = T.junctions.find(x => x.id === id); return [j.lat, j.lng]; };

  function card(title, body) { return `<div class="map-card"><h4>${title}</h4><p>${body}</p></div>`; }

  function layerToggles(root, map, groups) {
    root.querySelectorAll('[data-maplayer]').forEach(cb => cb.addEventListener('change', () => {
      const g = groups[cb.dataset.maplayer];
      cb.checked ? g.addTo(map) : g.remove();
    }));
    Object.values(groups).forEach(g => g.addTo(map));
  }

  function projectLine(map, vt) {
    const s0 = vt.project(T.junctions[0].lat, T.junctions[0].lng);
    const s1 = vt.project(T.junctions[7].lat, T.junctions[7].lng);
    L.polyline(vt.latlngs, { color: '#374151', weight: 7, opacity: 0.35 }).addTo(map);
    return L.polyline(vt.slice(s0, s1), { color: BRAND.red, weight: 6, opacity: 0.9 })
      .bindTooltip('Vt 12 Alasjärvi–Huutijärvi, 14 km', { sticky: true }).addTo(map);
  }

  // --- 1. Kasvu ja hankekokonaisuus ----------------------------------------------
  function growthMap(root) {
    const map = baseMap(root.querySelector('.map-box'));
    const vt = vt12Path();
    const panel = root.querySelector('.map-info');
    const show = html => { panel.innerHTML = html; };
    const g = { areas: L.layerGroup(), ring: L.layerGroup(), tram: L.layerGroup() };

    projectLine(map, vt).on('click', () => show(card('Vt 12 Alasjärvi–Huutijärvi', 'Kaksikaistainen tie on kasvun pullonkaula. Nelikaistaistus on kynnysinvestointi alueen muille hankkeille.')));

    const areas = [
      { c: R.places.lamminrahka, rx: 1200, ry: 750, rot: 15, color: BRAND.yellow, title: 'Lamminrahka–Ojala', label: 'Lamminrahka–Ojala · 12 000 as.', body: 'Uusi asuinalue noin 12 000 asukkaalle. Liikenne kytkeytyy vt 12:een Lamminrahkan eritasoliittymän kautta.' },
      { c: [61.4520, 23.9300], rx: 2000, ry: 1300, rot: -10, color: '#8b5e3c', labelOffset: [0, 34], title: 'Saarenmaan alue', label: 'Saarenmaa · 7 300 as. · 4 000 tp', body: 'Noin 7 300 asukasta ja 4 000 työpaikkaa. Yhteys vt 12:lle Kehä II:n Rusko–Lentola-jatkeen kautta.' },
      { c: [61.4560, 24.0780], rx: 3800, ry: 1700, rot: -28, color: BRAND.green, title: 'Keskustan uudistaminen ja taajaman laajentaminen', label: 'Keskustan uudistaminen', body: 'Kangasalan keskusta uudistuu ja taajama laajenee vt 12:n molemmin puolin.' }
    ];
    areas.forEach(a => {
      L.polygon(ellipse(a.c[0], a.c[1], a.rx, a.ry, a.rot), { color: BRAND.navy, weight: 2, dashArray: '6 5', fillColor: a.color, fillOpacity: 0.35 })
        .bindTooltip(a.label || a.title, { permanent: true, direction: 'center', offset: a.labelOffset || [0, 0], className: 'place-label' })
        .on('click', () => show(card(a.title, a.body))).addTo(g.areas);
    });
    const alas = [T.junctions[0].lat, T.junctions[0].lng];
    L.circleMarker(alas, { radius: 14, color: BRAND.navy, weight: 2, fillColor: BRAND.red, fillOpacity: 0.45 })
      .bindTooltip('Alasjärven liittymä', { sticky: true })
      .on('click', () => show(card('Alasjärven liittymä', 'Erittäin ruuhkainen liittymä parannetaan vt 12 -hankkeessa.'))).addTo(g.areas);
    [JL('lamminrahka'), JL('vatiala')].forEach(p => L.circleMarker(p, { radius: 11, color: BRAND.navy, weight: 2, fillColor: BRAND.orange, fillOpacity: 0.45 }).addTo(g.areas));

    // 2-kehä (tuleva): Saarenmaa.png ja laajempi_kokonaisuus.png (data/roads.js → ring)
    const ringStyle = { color: BRAND.red, weight: 4, dashArray: '2 8', lineCap: 'round' };
    [[[R.ring.north], '2-kehä Lentola–Tarastenjärvi (tuleva)', 'Uusi poikittainen yhteys Vatialan eritasoliittymästä pohjoiseen Lamminrahka–Ojalan itäpuolelta Tarastenjärvelle. Edellyttää toimivaa vt 12:ta.'],
     [[R.ring.south, R.ring.southBranch], '2-kehä Rusko–Lentola (tuleva)', 'Uudet yhteydet Lentolan eritasoliittymästä Saarenmaan alueen läpi Ruskon suuntaan. Yhdistää Ruskon ja Saarenmaan teollisuus- ja asuinalueet vt 12:een.']].forEach(([lines, t, b]) => {
      lines.forEach(ll => L.polyline(ll, ringStyle).bindTooltip(t, { sticky: true }).on('click', () => show(card(t, b))).addTo(g.ring));
    });

    // Raitiotie: raitiotie.png (data/roads.js → tram)
    const TRAM = '#1f5fd6';
    L.polyline(R.tram.linnainmaa, { color: TRAM, weight: 5, opacity: 0.9, lineCap: 'round' })
      .bindTooltip('Raitiotien jatke Kauppi–Linnainmaa–Kangasalan asema (suunniteltu)', { sticky: true })
      .on('click', () => show(card('Raitiotien jatke Linnainmaalle ja Kangasalan asemalle', 'Suunniteltu jatke Kaupista Heikkilänkadun varikon ja Linnainmaan kautta Atalaan, Rissoon ja Kangasalan asemalle. Tukee Lamminrahka–Ojalan kasvua.'))).addTo(g.tram);
    const tramEnd = R.tram.linnainmaa[R.tram.linnainmaa.length - 1];
    L.circleMarker(tramEnd, { radius: 6, color: '#fff', weight: 2, fillColor: TRAM, fillOpacity: 1 })
      .bindTooltip('Kangasalan asema', { direction: 'right', offset: [6, 0] }).addTo(g.tram);
    const hs = R.tram.saarenmaa;
    L.polyline(hs, { color: TRAM, weight: 4, dashArray: '8 7', lineCap: 'round', opacity: 0.85 })
      .bindTooltip('Yhteystarve Hervannasta Saarenmaalle', { sticky: true })
      .on('click', () => show(card('Yhteystarve Hervannasta Saarenmaalle', 'Joukkoliikenneyhteys Hervannan varikolta Saarenmaan kasvavalle alueelle. Linjausta ei ole vielä suunniteltu.'))).addTo(g.tram);
    const [a1, a2] = hs.slice(-2);
    const brg = Math.atan2((a2[1] - a1[1]) * Math.cos(a2[0] * Math.PI / 180), a2[0] - a1[0]) * 180 / Math.PI;
    L.marker(a2, { interactive: false, icon: L.divIcon({ className: 'map-arrow', html: `<span style="transform:rotate(${brg.toFixed(0)}deg)">▲</span>`, iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(g.tram);

    layerToggles(root, map, g);
    map.fitBounds(L.latLngBounds([[61.545, 23.78], [61.435, 24.13]]), { padding: [5, 5] });
    return map;
  }

  // --- 2. Ympäristö: melu, pyörätie, Natura, st 339 ----------------------------
  function envMap(root) {
    const map = baseMap(root.querySelector('.map-box'));
    const vt = vt12Path();
    const panel = root.querySelector('.map-info');
    const show = html => { panel.innerHTML = html; };
    const g = { noise: L.layerGroup(), bike: L.layerGroup(), natura: L.layerGroup(), st339: L.layerGroup() };
    projectLine(map, vt);

    // Melusuojaustarve: SUUNTAA ANTAVA. Lähdekuva (melusuojaus.png) kattaa vain Herttualan kohdan; muut osuudet on
    // sijoitettu asutuksen kohdalle. Tarkentuu tiesuunnitelmassa.
    const sideLine = (s0, s1, side) => {
      const out = [];
      for (let s = s0; s <= s1; s += 60) {
        const p = vt.at(s);
        const brg = 90 - p[2] * 180 / Math.PI + (side > 0 ? 90 : -90);
        out.push(offsetLL(p[0], p[1], brg, 110));
      }
      return out;
    };
    const noiseStretches = [
      [2600, 4400, -1, 'Linnainmaa–Leinola'], [2600, 4200, 1, 'Leinola'],
      [6200, 7800, 1, 'Vatiala'], [8200, 9800, -1, 'Suorama'],
      [11200, 12600, 1, 'Rantakoivisto'], [12600, 14400, -1, 'Herttuala'], [13800, 15400, 1, 'Kangasalan keskusta']
    ];
    noiseStretches.forEach(([a, b, side, name]) => {
      L.polyline(sideLine(a, b, side), { color: BRAND.orange, weight: 5, opacity: 0.9, lineCap: 'round' })
        .bindTooltip('Melusuojaustarve: ' + name, { sticky: true })
        .on('click', () => show(card('Meluntorjunta – ' + name, 'Melusuojaukselle on tarvetta pitkin hankealuetta. Kartan osuudet ovat suuntaa antavia; meluesteiden sijainnit ja tyypit tarkentuvat tiesuunnitelmassa.')))
        .addTo(g.noise);
    });

    // Pääpyörätie Suorama–Liuttu: Kangasalantien (st 339) varressa (data/roads.js → bike). Piirretty hieman
    // tien pohjoispuolelle, jotta st 339 -viiva näkyy rinnalla.
    const bikePath = new Path(R.bike);
    const bikeLL = [];
    for (let s = 0; s <= bikePath.length; s += 40) {
      const p = bikePath.at(s);
      bikeLL.push(offsetLL(p[0], p[1], 90 - p[2] * 180 / Math.PI - 90, 45));
    }
    L.polyline(bikeLL, { color: BRAND.navy, weight: 5, lineCap: 'round', dashArray: '10 6' })
      .bindTooltip('Seudullinen pääpyörätie, 1. vaihe Suorama–Liuttu', { sticky: true })
      .on('click', () => show(card('Seudullinen pääpyörätie, 1. vaihe Suorama–Liuttu', 'Kulkee pääosin Kangasalantien (vanha Tampere–Kangasala-tie) ja Kaukajärven pohjoisrannan tuntumassa ja yhdistää Kangasalan ja Tampereen seudullisen pyöräilyn pääreitin. Ylittää vt 12:n Lentolassa.')))
      .addTo(g.bike);
    L.circleMarker(JL('lentola'), { radius: 6, color: '#fff', weight: 2, fillColor: BRAND.navy, fillOpacity: 1 }).bindTooltip('Pääpyörätie ylittää vt 12:n (Lentola)').addTo(g.bike);
    [[R.bike[0], 'Liuttu', 'top'], [R.bike[R.bike.length - 1], 'Suorama', 'right']].forEach(([p, t, d]) =>
      L.circleMarker(p, { radius: 4, color: '#fff', weight: 2, fillColor: BRAND.navy, fillOpacity: 1 })
        .bindTooltip(t, { permanent: true, direction: d, offset: d === 'top' ? [0, -6] : [6, 0], className: 'place-label' }).addTo(g.bike));

    // Kirkkojärven Natura-alue: järven rantaviiva OSM:stä
    L.polygon(R.kirkkojarvi, { color: BRAND.green, weight: 3, dashArray: '4 6', fillColor: BRAND.green, fillOpacity: 0.18 })
      .bindTooltip('Kirkkojärven Natura-alue', { sticky: true })
      .on('click', () => show(card('Kirkkojärven Natura-alue', 'Melun ja tien estevaikutuksen vähentäminen huomioidaan suunnittelussa. Hankkeeseen sisältyy ulkoilureittien alikulkuja ja pieneläintunneleita; niiden sijainnit tarkentuvat tiesuunnitelmassa. Rajaus: järven rantaviiva (OSM), ei virallinen Natura-raja.')))
      .addTo(g.natura);

    // St 339 Kangasalantie: liikenteen vähenemä
    const st339 = new Path(R.st339);
    L.polyline(R.st339, { color: BRAND.cyan, weight: 5 }).bindTooltip('Kangasalantie (st 339)', { sticky: true }).addTo(g.st339);
    L.marker(st339.at(st339.length * 0.45).slice(0, 2), { icon: L.divIcon({ className: 'num-badge num-badge--cyan', html: '−8 600', iconSize: null }) })
      .on('click', () => show(card('Kangasalantie (st 339)', 'Liikenteen mallinnettu vähenemä noin 8 600 ajoneuvoa vuorokaudessa, kun liikenne siirtyy nelikaistaiselle vt 12:lle. Taajamaliikenne rauhoittuu.')))
      .addTo(g.st339);
    const vtMid = vt.at(vt.project(61.498, 23.91));
    L.marker([vtMid[0] + 0.004, vtMid[1]], { icon: L.divIcon({ className: 'num-badge num-badge--orange', html: '+8 600', iconSize: null }) })
      .bindTooltip('Vt 12: liikenne siirtyy pääväylälle').addTo(g.st339);

    layerToggles(root, map, g);
    map.fitBounds(L.latLngBounds([[61.507, 23.83], [61.442, 24.11]]), { padding: [5, 5] });
    return map;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const maps = {};
    const a = document.getElementById('kartta-kasvu'); if (a) maps.growth = growthMap(a);
    const b = document.getElementById('kartta-ymparisto'); if (b) maps.env = envMap(b);
    window.SiteMaps = maps;
  });
})();
