// Liikennemäärät (KVL = ajon./vrk, ras = raskas liikenne ajon./vrk), nykytila 2026 ja ennuste 2050.
// Lähde: Vt 12 Alasjärvi–Huutijärvi, liikennemäärät ja liikenne-ennuste v. 2050 (simulointi.png).
(function (root) {
  const TRAFFIC = {
    startYear: 2026,
    endYear: 2050,
    capacity11: 9000,   // 1+1, Väyläviraston ohjeita 16/2021
    capacity22: 45000,  // 2+2, havainnollistava oletus

    // Liittymät länsi → itä. lat/lng = kohta, jossa liittyvä tie (tai keskustan ramppi) risteää vt 12:n (OSM).
    // branches: liittyvät tiet. Geometria tulee data/roads.js:stä (OSM-rampit ja -tiet, tools/build_roads.js).
    // bearing = haaran suunta asteina (0 = pohjoinen); käytetään haaran valintaan ja varalla, jos roads.js puuttuu.
    junctions: [
      { id: 'alasjarvi', name: 'Alasjärven etl', lat: 61.4985, lng: 23.8852, labelDir: 'left',
        branches: [
          { bearing: 25, len: 1300, now: [20400, 1300], f2050: [27700, 1440] },
          { bearing: 195, len: 1300, now: [26000, 1700], f2050: [35300, 1880] }
        ] },
      { id: 'linnainmaa', name: 'Linnainmaan etl', lat: 61.4973, lng: 23.9154, labelDir: 'top',
        branches: [
          { bearing: 15, len: 1200, now: [6700, 500], f2050: [9100, 550] },
          { bearing: 165, len: 1700, now: [6200, 450], f2050: [8400, 500] }
        ] },
      { id: 'lamminrahka', name: 'Lamminrahkan etl', lat: 61.4907, lng: 23.9479, labelDir: 'left',
        branches: [
          { bearing: 15, len: 1000, now: [1800, 5], f2050: [7500, 30] }
        ] },
      { id: 'vatiala', name: 'Vatialan etl', lat: 61.4818, lng: 23.9710,
        branches: [
          { bearing: 40, len: 900, now: [5100, 250], f2050: [7000, 280] },
          { bearing: 225, len: 900, now: [2300, 20], f2050: [3200, 20] }
        ] },
      { id: 'lentola', name: 'Lentolan etl', lat: 61.4726, lng: 23.9824,
        branches: [
          { bearing: 65, len: 1000, now: [9900, 400], f2050: [13400, 440] },
          { bearing: 240, len: 1000, now: [12500, 500], f2050: [5900, 170] }
        ] },
      { id: 'rantakoivisto', name: 'Rantakoiviston etl', lat: 61.4639, lng: 24.0374,
        branches: [
          { bearing: 345, len: 900, now: [3600, 30], f2050: [5100, 40] },
          { bearing: 190, len: 900, now: [5100, 170], f2050: [7000, 190] }
        ] },
      { id: 'kangasala', name: 'Kangasalan etl', lat: 61.4607, lng: 24.0679,
        branches: [
          { bearing: 350, len: 900, now: [6500, 200], f2050: [8800, 220] }
        ] },
      { id: 'huutijarvi', name: 'Huutijärven etl', lat: 61.4481, lng: 24.1027, labelDir: 'left',
        branches: [
          { bearing: 30, len: 1000, now: [5400, 350], f2050: [7300, 390] },
          { bearing: 205, len: 800, now: [500, 30], f2050: [700, 30] }
        ] }
    ],

    // Vt 12 -osuudet. from/to = liittymän indeksi, -1 = linjan alku, 8 = linjan loppu.
    // labelAt (0–1) ja labelDir ('bottom') siirtävät lukutarraa, jos se osuu haaran tarran päälle.
    segments: [
      { from: -1, to: 0, name: 'Alasjärvi, länsi', now: [18900, 1250], f2050: [34900, 1770] },
      { from: 0, to: 1, name: 'Alasjärvi–Linnainmaa', labelDir: 'bottom', labelAt: 0.22, now: [22100, 950], f2050: [39300, 1440] },
      { from: 1, to: 2, name: 'Linnainmaa–Lamminrahka', now: [18050, 950], f2050: [33100, 1440] },
      { from: 2, to: 3, name: 'Lamminrahka–Vatiala', now: [18400, 950], f2050: [32300, 1440] },
      { from: 3, to: 4, name: 'Vatiala–Lentola', now: [15500, 700], f2050: [28300, 1160] },
      { from: 4, to: 5, name: 'Lentola–Rantakoivisto', labelAt: 0.72, now: [17400, 800], f2050: [23900, 890] },
      { from: 5, to: 6, name: 'Rantakoivisto–Kangasala', now: [18100, 830], f2050: [24800, 920] },
      { from: 6, to: 7, name: 'Kangasala–Huutijärvi', now: [14400, 900], f2050: [19700, 1000] },
      { from: 7, to: 8, name: 'Huutijärvi, itä', labelDir: 'bottom', now: [8900, 700], f2050: [12100, 780] }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = TRAFFIC;
  else root.TRAFFIC = TRAFFIC;
})(typeof window !== 'undefined' ? window : globalThis);
