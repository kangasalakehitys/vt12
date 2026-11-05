# Vt 12 Alasjärvi–Huutijärvi – edunvalvontasivusto

Mobiiliin skaalautuva sivusto sekä siitä tuotettavat PowerPoint- ja PDF-materiaalit.

## Rakenne
- `site/` – julkaistava sivusto (pelkkää HTML/CSS/JS:ää, ei käännösvaihetta)
  - `data/content.js` – **kaikki tekstit ja luvut**. Muokkaa vain tätä; sivusto, PowerPoint ja PDF päivittyvät siitä.
  - `data/traffic.js` – liittymät ja liikennemäärät nyt / 2050 (simulointi.png), kapasiteetit
  - `data/vt12-line.js` – vt 12 -tielinja (OpenStreetMap)
  - `js/sim-vt12.js` – liikennesimulaatio 2026–2050
  - `js/sim-business.js` – elinkeinoelämän kuljetussimulaatio
  - `js/maps.js` – kasvukartta, ympäristön koontikartta, sotilaallinen liikkuvuus
  - `downloads/` – valmiit PowerPoint, PDF-esite, painoversio ja karttakuvat
- `tools/` – skriptit materiaalien tuottamiseen

## Esikatselu
Karttapohja (OpenStreetMap) vaatii, että sivu avataan palvelimen kautta, ei suoraan tiedostona:

```
node tools/serve.js
```
ja avaa http://localhost:8080

## Materiaalien päivitys
Kun tekstejä tai lukuja on muutettu:

```
cd tools
npm install        # vain ensimmäisellä kerralla
npm run all        # karttakuvat → PowerPoint → PDF-esite ja painoversio
```
Skriptit käyttävät koneen Chromea tai Edgeä.

## Huomioita
- Simulaation välivuodet on laskettu tasaisella kasvulla nykytilasta 2050-ennusteeseen. 2+2-tien kapasiteetti (45 000 ajon./vrk) on havainnollistava oletus.
- Elinkeinokartan reitit, melusuojaustarpeet, pyörätie ja Natura-alue on piirretty karkeasti lähdekuvien perusteella.
- Vertailutaulukon luvut: Väyläviraston julkaisuja 33/2026, taulukot 2 ja 9. Vt 12 Risala–Mankalan H/K 0,7 on hankekuvauksesta; toimivuusarvoa ei ole julkaistu.
