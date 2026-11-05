// Täyttää sivun tekstit ja infografiikat data/content.js:stä.
(function () {
  const C = window.CONTENT;
  const get = path => path.split('.').reduce((o, k) => (o ? o[k] : undefined), C);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const li = arr => arr.map(t => `<li>${esc(t)}</li>`).join('');
  const num = n => n.toLocaleString('fi-FI');
  const dec = n => n == null ? '–' : n.toFixed(2).replace('.', ',');

  const ICONS = {
    traffic: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="20" width="36" height="14" rx="4"/><circle cx="14" cy="36" r="4"/><circle cx="34" cy="36" r="4"/><path d="M12 20l5-8h14l5 8"/></svg>',
    euro: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18"/><path d="M31 15a10 10 0 1 0 0 18M12 21h15M12 27h15"/></svg>',
    clock: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18"/><path d="M24 12v13l8 5"/></svg>'
  };

  const R = {
    heroStats: () => C.hero.stats.map(s => `<li><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`).join(''),
    overviewItems: () => li(C.overview.items),
    overviewFacts: () => C.overview.facts.map(f => `<div class="fact"><h3>${esc(f.head)}</h3>${f.lines.map(l => `<p>${esc(l)}</p>`).join('')}${f.note ? `<small>${esc(f.note)}</small>` : ''}</div>`).join(''),
    timeline: () => C.overview.timeline.map(t => `<li><b>${esc(t.when)}</b><span>${esc(t.what)}</span></li>`).join(''),
    reasonCards: () => C.reasons.cards.map(c => `<div class="card">${ICONS[c.icon] || ''}<h3>${esc(c.head)}</h3><p>${esc(c.text)}</p></div>`).join(''),
    reasonMore: () => li(C.reasons.more),
    capBullets: () => li(C.capacity.bullets),
    capChart: () => {
      const c = C.capacity, max = c.kvl2050Max;
      const bar = (label, from, to, cls, valueTxt) => `
        <div class="capbar ${cls}">
          <span class="capbar__label">${label}</span>
          <span class="capbar__track"><span class="capbar__fill" style="left:${from / max * 100}%;width:${(to - from) / max * 100}%"></span></span>
          <span class="capbar__value">${valueTxt}</span>
        </div>`;
      return bar('Kapasiteetti 1+1', 0, c.capacity, 'capbar--cap', num(c.capacity)) +
        bar('Liikenne nyt', c.kvlMin, c.kvlMax, 'capbar--now', `${num(c.kvlMin)}–${num(c.kvlMax)}`) +
        bar('Ennuste 2050', 19700, c.kvl2050Max, 'capbar--2050', `enint. ${num(c.kvl2050Max)}`) +
        `<div class="capchart__line" style="left:calc(var(--labelw) + (100% - var(--labelw) - var(--valuew)) * ${c.capacity / max})"><span>Kapasiteetti</span></div>
         <p class="capchart__unit">ajoneuvoa vuorokaudessa (KVL)</p>`;
    },
    bottleneckBullets: () => li(C.bottleneck.bullets),
    bottleneckLink: el => { el.href = C.bottleneck.link.href; return esc(C.bottleneck.link.text) + ' ↗'; },
    profitBullets: () => li(C.profitability.bullets),
    hkBars: () => {
      const rows = C.profitability.rows, max = 3;
      return rows.map(r => `<div class="hkbar${r.own ? ' hkbar--own' : ''}">
          <span class="hkbar__name">${esc(r.name)}</span>
          <span class="hkbar__track"><span class="hkbar__fill" style="width:${r.hk / max * 100}%"></span></span>
          <span class="hkbar__val">${dec(r.hk)}</span></div>`).join('') +
        `<div class="hkbar hkbar--axis"><span></span><span class="hkbar__track"><span class="hkbar__one" style="left:${100 / max}%">H/K = 1 kannattavuuden raja</span></span><span></span></div>`;
    },
    hkTable: () => `<thead><tr><th>Hanke</th><th>Sijainti</th><th class="num">H/K</th><th class="num">Toimivuus</th></tr></thead><tbody>` +
      C.profitability.rows.map(r => `<tr${r.own ? ' class="is-own"' : ''}><td>${esc(r.name)}</td><td>${esc(r.place)}</td><td class="num">${dec(r.hk)}</td><td class="num">${dec(r.func)}</td></tr>`).join('') + '</tbody>',
    growthBullets: () => li(C.growth.bullets),
    businessBullets: () => li(C.business.bullets),
    envBullets: () => li(C.environment.bullets),
    defenceBullets: () => li(C.defence.bullets),
    share: () => {
      const url = location.href.split('#')[0];
      const u = encodeURIComponent(url), t = encodeURIComponent(C.share.text);
      const links = [
        ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
        ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
        ['X', `https://x.com/intent/post?url=${u}&text=${t}`],
        ['WhatsApp', `https://wa.me/?text=${t}%20${u}`],
        ['Sähköposti', `mailto:?subject=${t}&body=${u}`]
      ];
      return `<span class="share__label">${esc(C.share.label)}:</span>` +
        (navigator.share ? '<button type="button" class="share__btn" data-share="native">Jaa…</button>' : '') +
        links.map(([n, h]) => `<a class="share__btn" href="${h}"${h.startsWith('mailto') ? '' : ' target="_blank" rel="noopener"'}>${n}</a>`).join('') +
        '<button type="button" class="share__btn" data-share="copy">Kopioi linkki</button>';
    }
  };

  function shareActions() {
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-share]');
      if (!b) return;
      const url = location.href.split('#')[0];
      if (b.dataset.share === 'native') {
        navigator.share({ title: document.title, text: C.share.text, url }).catch(() => {});
      } else {
        const done = () => { const old = b.textContent; b.textContent = 'Kopioitu ✓'; setTimeout(() => { b.textContent = old; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt('Kopioi linkki:', url));
        else prompt('Kopioi linkki:', url);
      }
    });
  }

  function render() {
    document.querySelectorAll('[data-c]').forEach(el => { const v = get(el.dataset.c); if (v != null) el.textContent = v; });
    document.querySelectorAll('[data-render]').forEach(el => { const f = R[el.dataset.render]; if (f) el.innerHTML = f(el); });
  }

  function nav() {
    const btn = document.querySelector('.nav-toggle'), navEl = document.getElementById('nav');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open); navEl.classList.toggle('is-open', open);
    });
    navEl.addEventListener('click', e => { if (e.target.tagName === 'A') { btn.setAttribute('aria-expanded', 'false'); navEl.classList.remove('is-open'); } });
  }

  document.addEventListener('DOMContentLoaded', () => { render(); nav(); shareActions(); });
})();
