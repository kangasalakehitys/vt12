// Tulostettava A4-esite ja painoversio (3 mm leikkuuvarat) sivustosta.
// Simulaatiot korvataan staattisilla karttakuvilla. Aja ensin: node snapshot_maps.js
const path = require('path');
const { launch, openSite, sleep, SITE } = require('./browser');

const OUT = path.join(SITE, 'downloads');

async function prepare(page) {
  await page.evaluate(() => {
    const fig = (srcs, caption) => {
      const f = document.createElement('figure');
      f.className = 'print-fig';
      f.innerHTML = srcs.map(([src, label]) => `<div><img src="downloads/img/${src}" alt=""><figcaption>${label}</figcaption></div>`).join('') +
        (caption ? `<p class="source">${caption}</p>` : '');
      return f;
    };
    const sim = document.getElementById('simulaatio-vt12');
    sim.replaceWith(fig([['sim_2026.png', 'Nykytila 2026'], ['sim_2050_1plus1.png', '2050 kaksikaistaisena (1+1): tie ruuhkautuu'], ['sim_2050_2plus2.png', '2050 nelikaistaisena (2+2): liikenne sujuu']]));
    const biz = document.getElementById('simulaatio-elinkeino');
    biz.replaceWith(fig([['elinkeino_2050_1plus1.png', 'Kuljetusvirrat 2050: teollisuus (oranssi), ruoka (vihreä), satamat (keltainen), Lamminrahka–Ojala (okra), henkilöautot (sininen)']]));
    document.getElementById('kartta-kasvu').replaceWith(fig([['kasvu.png', 'Kasvualueet, 2-kehä ja raitiotie (karkea esitys)']]));
    document.getElementById('kartta-ymparisto').replaceWith(fig([['ymparisto.png', 'Melusuojaustarve (oranssi), pääpyörätie ja st 339 (turkoosi), Kirkkojärven Natura-alue (vihreä), alikulut (vihreät pisteet)']]));
    const style = document.createElement('style');
    style.textContent = `
      .print-fig { margin: 8px 0 0; display: grid; gap: 8px; }
      .print-fig img { display: block; width: 100%; height: auto; max-height: 150mm; object-fit: contain; object-position: left top; border: 1px solid #ddd; }
      .print-fig figcaption { font-size: 9pt; font-weight: 700; margin-top: 2px; }
      @media print { .section--map { break-before: page; } .print-fig div { break-inside: avoid; } }`;
    document.head.appendChild(style);
  });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
  await sleep(2000);
}

(async () => {
  const browser = await launch();
  const page = await openSite(browser, { width: 1100, height: 1400 });
  await prepare(page);
  await page.emulateMediaType('print');

  await page.pdf({ path: path.join(OUT, 'Vt12_Alasjarvi-Huutijarvi_esite.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('Valmis: esite (A4)');

  // Painoversio: sivukoko A4 + 3 mm leikkuuvara joka reunalla.
  await page.addStyleTag({ content: '@page { size: 216mm 303mm; margin: 17mm 17mm 19mm; }' });
  await page.pdf({ path: path.join(OUT, 'Vt12_Alasjarvi-Huutijarvi_esite_paino.pdf'), width: '216mm', height: '303mm', printBackground: true, preferCSSPageSize: true });
  console.log('Valmis: painoversio (A4 + 3 mm leikkuuvarat)');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
