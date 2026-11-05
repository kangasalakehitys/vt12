// Tallentaa sivuston kartoista kuvat PowerPointiin ja PDF:ään: site/downloads/img/*.png
const fs = require('fs');
const path = require('path');
const { launch, openSite, sleep, SITE } = require('./browser');

const OUT = path.join(SITE, 'downloads', 'img');

async function shot(page, selector, file) {
  const el = await page.$(selector);
  await el.screenshot({ path: path.join(OUT, file) });
  console.log('  ' + file);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const page = await openSite(browser, { width: 1600, height: 1000 });
  await page.addStyleTag({ content: '.leaflet-control-zoom{display:none!important}' });
  const go = async id => { await page.evaluate(i => document.getElementById(i).scrollIntoView(), id); await sleep(1200); };

  console.log('Karttakuvat:');
  await go('simulaatio');
  for (const [year, upgrade, file] of [[2026, null, 'sim_2026.png'], [2050, null, 'sim_2050_1plus1.png'], [2050, 2030, 'sim_2050_2plus2.png']]) {
    await page.evaluate((y, u) => { SimVT12.setUpgrade(u); SimVT12.setYear(y); }, year, upgrade);
    await sleep(2500); // karttalaatat
    await shot(page, '#simulaatio-vt12 .sim__mapwrap', file);
  }

  await go('elinkeinot');
  for (const [four, file] of [[false, 'elinkeino_2050_1plus1.png'], [true, 'elinkeino_2050_2plus2.png']]) {
    await page.evaluate(f => SimBusiness.set(2050, f), four);
    await sleep(2500);
    await shot(page, '#simulaatio-elinkeino .sim__mapwrap', file);
  }

  await go('kasvu'); await sleep(1500); await shot(page, '#kartta-kasvu .map-box', 'kasvu.png');
  await go('ymparisto'); await sleep(1500); await shot(page, '#kartta-ymparisto .map-box', 'ymparisto.png');

  await browser.close();
  console.log('Valmis: ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
