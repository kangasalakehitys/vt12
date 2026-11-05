// Yhteiset karttatyökalut: pohjakartta, linjan mittaus ja pisteen haku matkan perusteella.
(function () {
  const BRAND = {
    red: '#DE232F', yellow: '#FCB316', orange: '#E64925',
    navy: '#28336C', cyan: '#00ADC5', green: '#009651',
    grey: '#6b7280', light: '#f3f4f6'
  };

  // Paikallinen tasoprojektio metreinä (riittää ~50 km alueelle).
  const LAT0 = 61.48;
  const MX = 111320 * Math.cos(LAT0 * Math.PI / 180);
  const MY = 110540;
  const toXY = (lat, lng) => [lng * MX, lat * MY];
  const toLL = (x, y) => [y / MY, x / MX];

  // Polyline: [[lat,lng], ...] → mitattava olio.
  function Path(latlngs) {
    const pts = latlngs.map(p => toXY(p[0], p[1]));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    this.latlngs = latlngs;
    this.pts = pts;
    this.cum = cum;
    this.length = cum[cum.length - 1];
  }
  // Palauttaa [lat, lng, suuntakulma radiaaneina (x itään, y pohjoiseen)]
  Path.prototype.at = function (s) {
    const c = this.cum;
    if (s <= 0) s = 0;
    if (s >= this.length) s = this.length - 0.001;
    let lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; }
    const a = this.pts[lo], b = this.pts[hi];
    const t = (s - c[lo]) / ((c[hi] - c[lo]) || 1);
    const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
    const ll = toLL(x, y);
    return [ll[0], ll[1], Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  // Lähimmän pisteen matka linjan alusta.
  Path.prototype.project = function (lat, lng) {
    const p = toXY(lat, lng);
    let best = Infinity, bestS = 0;
    for (let i = 1; i < this.pts.length; i++) {
      const a = this.pts[i - 1], b = this.pts[i];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L2 = dx * dx + dy * dy || 1;
      let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]);
      if (d < best) { best = d; bestS = this.cum[i - 1] + Math.sqrt(L2) * t; }
    }
    return bestS;
  };
  Path.prototype.slice = function (s0, s1) {
    const out = [];
    const step = s1 >= s0 ? 1 : -1;
    out.push(this.at(s0).slice(0, 2));
    if (step > 0) { for (let i = 0; i < this.cum.length; i++) if (this.cum[i] > s0 && this.cum[i] < s1) out.push(this.latlngs[i]); }
    else { for (let i = this.cum.length - 1; i >= 0; i--) if (this.cum[i] < s0 && this.cum[i] > s1) out.push(this.latlngs[i]); }
    out.push(this.at(s1).slice(0, 2));
    return out;
  };

  // Piste annetun suunnan ja matkan päässä.
  function offsetLL(lat, lng, bearingDeg, meters) {
    const b = bearingDeg * Math.PI / 180;
    const [x, y] = toXY(lat, lng);
    return toLL(x + Math.sin(b) * meters, y + Math.cos(b) * meters);
  }

  // Ellipsi monikulmiona (kasvualueet ym.).
  function ellipse(lat, lng, rxMeters, ryMeters, rotDeg = 0, n = 48) {
    const [cx, cy] = toXY(lat, lng);
    const r = rotDeg * Math.PI / 180;
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const x = Math.cos(t) * rxMeters, y = Math.sin(t) * ryMeters;
      out.push(toLL(cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)));
    }
    return out;
  }

  function baseMap(el, opts = {}) {
    const map = L.map(el, Object.assign({
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
      preferCanvas: false
    }, opts));
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
      className: 'basemap',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-tekijät'
    }).addTo(map);
    // Rullaus zoomaa vasta kun karttaa on klikattu (ettei sivun vieritys jumitu karttaan).
    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());
    return map;
  }

  function vt12Path() {
    return new Path(window.VT12_LINE.map(p => [p[1], p[0]]));
  }

  const fmt = n => Math.round(n).toLocaleString('fi-FI');
  const lerp = (a, b, t) => a + (b - a) * t;

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.MapKit = { BRAND, Path, offsetLL, ellipse, baseMap, vt12Path, fmt, lerp, toXY, toLL, reducedMotion };
})();
