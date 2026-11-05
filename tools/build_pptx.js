// Rakentaa PowerPoint-esityksen sivuston sisällöstä (site/data/content.js) ja karttakuvista.
// Noudattaa pptx_template.md:n brändisääntöjä. Aja ensin: node snapshot_maps.js
const path = require('path');
const fs = require('fs');
const PptxGenJS = require('pptxgenjs');
const C = require('../site/data/content.js');

const ROOT = path.resolve(__dirname, '..');
const BG = f => path.join(ROOT, 'site', 'assets', 'bg', f);
const IMG = f => path.join(ROOT, 'site', 'downloads', 'img', f);
const OUT = path.join(ROOT, 'site', 'downloads', 'Vt12_Alasjarvi-Huutijarvi_esitys.pptx');

const FONT = 'Century Gothic';
const RED = 'DE232F', TITLE_RED = 'E01F27', NAVY = '28336C', GREY = '8A8A8A', BLACK = '000000', WHITE = 'FFFFFF';
const SECTION_BGS = ['head_blue_bg.jpg', 'head_cyan_bg.jpg', 'head_orange_bg.jpg', 'head_grey_bg.jpg', 'head_yellow_bg.jpg'];
const LAST_BGS = ['head_pic_1_bg.jpg', 'head_pic_2_bg.jpg', 'head_pic_3_bg.jpg', 'head_pic_4_bg.jpg', 'head_pic_5_bg.jpg', 'head_pic_6_bg.jpg'];

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13,33 × 7,5 in
pptx.author = C.meta.org;
pptx.title = C.meta.title + ' – ' + C.meta.subtitle;
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };

const W = 13.333;
const CONTENT_W = 10.6; // oikean reunan g-muoto jää vapaaksi
let sectionIdx = 0;

function titleSlide() {
  const s = pptx.addSlide();
  s.background = { path: BG('front_bg_red.jpg') };
  s.addText(C.meta.title, { x: 2.6, y: 2.3, w: 9.5, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, color: WHITE });
  s.addText(C.meta.subtitle, { x: 2.6, y: 2.95, w: 9.5, h: 1.9, fontFace: FONT, fontSize: 52, bold: true, color: WHITE, valign: 'top' });
  s.addText(`${C.meta.org} · ${C.meta.updated}`, { x: 2.6, y: 6.3, w: 9.5, h: 0.5, fontFace: FONT, fontSize: 18, color: WHITE });
}

function sectionSlide(title, sub) {
  const s = pptx.addSlide();
  const bg = SECTION_BGS[sectionIdx++ % SECTION_BGS.length];
  s.background = { path: BG(bg) };
  const dark = bg === 'head_yellow_bg.jpg' || bg === 'head_grey_bg.jpg';
  s.addText(title, { x: 0.9, y: 2.4, w: 8.4, h: 1.8, fontFace: FONT, fontSize: 40, bold: true, color: dark ? BLACK : WHITE, valign: 'bottom' });
  if (sub) s.addText(sub, { x: 0.9, y: 4.3, w: 8.4, h: 0.9, fontFace: FONT, fontSize: 20, color: dark ? BLACK : WHITE, valign: 'top' });
}

// Karttadioilla pienempi otsikko, jotta kartta saa enemmän tilaa.
function contentSlide(title, { map = false } = {}) {
  const s = pptx.addSlide();
  s.background = { path: BG('txt_bg_white.jpg') };
  s.addText(title, map
    ? { x: 0.6, y: 0.25, w: CONTENT_W, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, color: TITLE_RED, valign: 'middle' }
    : { x: 0.6, y: 0.35, w: CONTENT_W, h: 0.9, fontFace: FONT, fontSize: 36, bold: true, color: TITLE_RED, valign: 'middle' });
  return s;
}

function bullets(s, items, opts) {
  s.addText(items.map(t => ({ text: t, options: { bullet: { code: '25A0' }, paraSpaceAfter: 8 } })),
    Object.assign({ fontFace: FONT, fontSize: 16, color: BLACK, valign: 'top' }, opts));
}

function source(s, text) {
  s.addText(text, { x: 0.6, y: 6.85, w: CONTENT_W, h: 0.4, fontFace: FONT, fontSize: 9, color: GREY, valign: 'top' });
}

// PNG:n mitat otsakkeesta (IHDR), jotta kuva sovitetaan laatikkoon kuvasuhde säilyttäen.
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function image(s, file, box, align = 'center') {
  if (!fs.existsSync(IMG(file))) { console.warn('Puuttuu kuva ' + file + ' – aja node snapshot_maps.js'); return; }
  const { w: pw, h: ph } = pngSize(IMG(file));
  const scale = Math.min(box.w / pw, box.h / ph);
  const w = pw * scale, h = ph * scale;
  const x = align === 'left' ? box.x : box.x + (box.w - w) / 2;
  const y = align === 'left' ? box.y : box.y + (box.h - h) / 2;
  s.addImage({ path: IMG(file), x, y, w, h });
  return { x, y, w, h };
}

function statTile(s, x, y, w, value, label, fill = RED) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h: 1.45, fill: { color: fill }, line: { color: fill } });
  s.addText(value, { x: x + 0.15, y: y + 0.1, w: w - 0.3, h: 0.8, fontFace: FONT, fontSize: 26, bold: true, color: WHITE });
  s.addText(label, { x: x + 0.15, y: y + 0.85, w: w - 0.3, h: 0.55, fontFace: FONT, fontSize: 12, color: WHITE, valign: 'top' });
}

// ---------------------------------------------------------------------------
titleSlide();

// Avainluvut
{
  const s = contentSlide('Suomen kannattavin yhteysvälihanke');
  s.addText(C.hero.lead, { x: 0.6, y: 1.35, w: CONTENT_W, h: 0.8, fontFace: FONT, fontSize: 18, color: BLACK });
  const n = C.hero.stats.length, gap = 0.18, w = (CONTENT_W - gap * (n - 1)) / n;
  C.hero.stats.forEach((st, i) => statTile(s, 0.6 + i * (w + gap), 2.5, w, st.value, st.label));
  bullets(s, C.reasons.cards.map(c => `${c.head} ${c.text}`).concat(C.reasons.more), { x: 0.6, y: 4.25, w: CONTENT_W, h: 2.5 });
}

// Hanke lyhyesti
{
  const s = contentSlide(C.overview.title);
  bullets(s, C.overview.items, { x: 0.6, y: 1.4, w: 5.4, h: 3.4 });
  C.overview.facts.forEach((f, i) => {
    const y = 1.4 + i * 1.45;
    s.addShape(pptx.ShapeType.rect, { x: 6.4, y, w: 0.08, h: 1.2, fill: { color: RED }, line: { color: RED } });
    s.addText([{ text: f.head.toUpperCase() + '\n', options: { fontSize: 11, color: GREY, bold: true } },
      { text: f.lines.join('\n'), options: { fontSize: 16, bold: true, color: BLACK } }],
    { x: 6.6, y, w: 4.5, h: 1.2, fontFace: FONT, valign: 'top' });
  });
  // Aikajana
  const tl = C.overview.timeline, tw = CONTENT_W / tl.length;
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 5.75, w: CONTENT_W, h: 0, line: { color: 'CCCCCC', width: 2 } });
  tl.forEach((t, i) => {
    s.addShape(pptx.ShapeType.ellipse, { x: 0.6 + i * tw, y: 5.62, w: 0.26, h: 0.26, fill: { color: RED }, line: { color: RED } });
    s.addText([{ text: t.when + '\n', options: { bold: true, color: TITLE_RED } }, { text: t.what, options: { color: BLACK } }],
      { x: 0.6 + i * tw, y: 5.95, w: tw - 0.15, h: 0.8, fontFace: FONT, fontSize: 12, valign: 'top' });
  });
  source(s, C.overview.facts[1].note);
}

sectionSlide('Kapasiteettiin nähden kaksinkertainen liikenne', 'Maan vilkkain kaksikaistainen pääväylä');

// Kapasiteetti
{
  const s = contentSlide('Liikenne ylittää kapasiteetin');
  const c = C.capacity;
  s.addChart(pptx.ChartType.bar, [{ name: 'ajon./vrk', labels: ['Kapasiteetti 1+1', 'Liikenne nyt (enint.)', 'Ennuste 2050 (enint.)'], values: [c.capacity, c.kvlMax, c.kvl2050Max] }], {
    x: 0.6, y: 1.4, w: 5.6, h: 4.6, barDir: 'bar', chartColors: ['8A8A8A', RED, RED], varyColors: true,
    catAxisLabelFontFace: FONT, catAxisLabelFontSize: 12, valAxisLabelFontFace: FONT, valAxisLabelFontSize: 10,
    valAxisLabelFormatCode: '#,##0', showValue: true, dataLabelFontFace: FONT, dataLabelFontSize: 12, dataLabelFormatCode: '#,##0',
    valGridLine: { style: 'none' }, catAxisOrientation: 'maxMin'
  });
  bullets(s, c.bullets, { x: 6.5, y: 1.4, w: 4.7, h: 4.8 });
  source(s, 'KVL = keskimääräinen vuorokausiliikenne. Ennuste 2050: vilkkain osuus Alasjärvi–Linnainmaa.');
}

// Pullonkaula
{
  const s = contentSlide(C.bottleneck.title);
  bullets(s, C.bottleneck.bullets, { x: 0.6, y: 1.5, w: 6.2, h: 4.5, fontSize: 18 });
  statTile(s, 7.3, 1.6, 3.8, 'HCM E–F', 'Maan pisin sujuvuusongelmainen tiejakso');
  statTile(s, 7.3, 3.3, 3.8, '14–21 000', 'ajoneuvoa vuorokaudessa kaksikaistaisella tiellä', NAVY);
  source(s, 'Lähde: ' + C.bottleneck.link.href);
}

sectionSlide('Liikenne 2026–2050', 'Simulaatio: kaksikaistainen tie ruuhkautuu, nelikaistainen sujuu');

{
  const s = contentSlide('Liikennemäärät nyt (2026)', { map: true });
  image(s, 'sim_2026.png', { x: 0.6, y: 0.95, w: CONTENT_W, h: 5.85 });
  source(s, 'Luvut: KVL / raskas liikenne ajon./vrk. Värit: kuormitus suhteessa 1+1-tien kapasiteettiin 9 000 ajon./vrk.');
}
{
  const s = contentSlide('Vuonna 2050: 1+1 vs. 2+2', { map: true });
  s.addText('1+1 – tie ruuhkautuu pahasti', { x: 0.6, y: 0.95, w: 5.2, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: TITLE_RED });
  s.addText('2+2 – liikenne jakautuu kahdelle kaistalle', { x: 6.0, y: 0.95, w: 5.2, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: '009651' });
  image(s, 'sim_2050_1plus1.png', { x: 0.6, y: 1.35, w: 5.2, h: 5.3 }, 'left');
  image(s, 'sim_2050_2plus2.png', { x: 6.0, y: 1.35, w: 5.2, h: 5.3 }, 'left');
  source(s, C.simulation.note);
}

sectionSlide('Maan kannattavin yhteysvälihanke', 'Hyöty-kustannussuhde 2,85');

{
  const s = contentSlide('Vt 12 ja vertailukelpoiset hankkeet');
  const rows = C.profitability.rows.slice().reverse();
  s.addChart(pptx.ChartType.bar, [{ name: 'H/K', labels: rows.map(r => r.name), values: rows.map(r => r.hk) }], {
    x: 0.4, y: 1.25, w: 6.6, h: 5.5, barDir: 'bar', varyColors: true,
    chartColors: rows.map(r => r.own ? RED : 'B8B8B8'),
    catAxisLabelFontFace: FONT, catAxisLabelFontSize: 9, valAxisHidden: true, valGridLine: { style: 'none' },
    showValue: true, dataLabelFontFace: FONT, dataLabelFontSize: 10, dataLabelFormatCode: '0.00', valAxisMinVal: 0, valAxisMaxVal: 3
  });
  bullets(s, C.profitability.bullets, { x: 7.2, y: 1.4, w: 3.9, h: 5, fontSize: 15 });
  source(s, C.profitability.tableSource);
}
{
  const s = contentSlide('H/K-suhde ja toimivuus');
  const dec = n => n == null ? '–' : n.toFixed(2).replace('.', ',');
  const head = ['Hanke', 'Sijainti', 'H/K', 'Toimivuus'].map((t, i) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: RED }, margin: [4, 10, 4, 10], align: i >= 2 ? 'right' : 'left' } }));
  const body = C.profitability.rows.map(r => [r.name, r.place, dec(r.hk), dec(r.func)].map((t, i) => ({
    text: t, options: { bold: !!r.own, color: BLACK, align: i >= 2 ? 'right' : 'left', margin: [4, 10, 4, 10] }
  })));
  s.addTable([head, ...body], { x: 0.6, y: 1.35, w: CONTENT_W, colW: [5.2, 2.4, 1.4, 1.6], fontFace: FONT, fontSize: 12,
    border: { type: 'solid', color: 'DDDDDD', pt: 0.75 }, rowH: 0.42 });
  source(s, C.profitability.tableSource);
}

sectionSlide('Kasvu ja elinkeinoelämä', 'Vt 12 on kynnysinvestointi alueen kasvulle');

{
  const s = contentSlide('Vt 12 osa isoa hankekokonaisuutta', { map: true });
  image(s, 'kasvu.png', { x: 0.6, y: 0.95, w: 7.2, h: 5.8 }, 'left');
  bullets(s, C.growth.bullets, { x: 8.0, y: 1.0, w: 3.2, h: 5.6, fontSize: 15 });
}
{
  const s = contentSlide(C.business.title, { map: true });
  image(s, 'elinkeino_2050_1plus1.png', { x: 0.6, y: 0.95, w: 7.2, h: 4.75 }, 'left');
  bullets(s, C.business.bullets, { x: 8.0, y: 1.0, w: 3.2, h: 5.7, fontSize: 13 });
  s.addText('Raskas liikenne 650–1 000 ajon./vrk koko hankealueella', { x: 0.6, y: 5.85, w: 7.2, h: 0.8, fontFace: FONT, fontSize: 18, bold: true, color: WHITE, fill: { color: 'E64925' }, align: 'center' });
  source(s, 'Kartta: teollisuuden rekat (oranssi), ruokakuljetukset Sahalahdelta (vihreä), satamakuljetukset (keltainen) ja henkilöautot (sininen) vuonna 2050. Reitit karkeita.');
}

sectionSlide('Ympäristö ja turvallisuus', 'Meluntorjunta, pyöräily ja sotilaallinen liikkuvuus');

{
  const s = contentSlide('Melusuojaus, pyöräväylät ja taajamaliikenne', { map: true });
  image(s, 'ymparisto.png', { x: 0.6, y: 0.95, w: 7.2, h: 5.8 }, 'left');
  bullets(s, C.environment.bullets, { x: 8.0, y: 1.0, w: 3.2, h: 5.6, fontSize: 13 });
  source(s, 'Kartan kohteet karkeasti: melusuojaustarve (oranssi), pääpyörätie ja st 339 (turkoosi), Kirkkojärven Natura-alue (vihreä katkoviiva).');
}
{
  const s = contentSlide(C.defence.title);
  bullets(s, C.defence.bullets, { x: 0.6, y: 1.5, w: 6.2, h: 4.5, fontSize: 20 });
  ['TEN-T', 'E16', 'Milmob', 'Rauma–Kouvola'].forEach((t, i) =>
    s.addText(t, { x: 7.3, y: 1.6 + i * 1.05, w: 3.8, h: 0.85, fontFace: FONT, fontSize: 24, bold: true, color: WHITE, fill: { color: i % 2 ? RED : NAVY }, align: 'center', valign: 'middle' }));
}

// Loppudia
{
  const s = pptx.addSlide();
  s.background = { path: BG(LAST_BGS[0]) };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 6.2, h: 7.5, fill: { color: WHITE, transparency: 18 }, line: { color: WHITE, transparency: 100 } });
  s.addText(C.closing.title, { x: 0.6, y: 0.5, w: 5.4, h: 2.4, fontFace: FONT, fontSize: 48, bold: true, color: TITLE_RED, valign: 'top' });
  s.addText(C.closing.text, { x: 0.6, y: 3.05, w: 5.3, h: 2.3, fontFace: FONT, fontSize: 16, color: BLACK, valign: 'top' });
  s.addText(C.closing.punch, { x: 0.6, y: 5.5, w: 5.4, h: 1.0, fontFace: FONT, fontSize: 24, bold: true, color: NAVY, valign: 'top' });
}

pptx.writeFile({ fileName: OUT }).then(f => console.log('Valmis: ' + f));
