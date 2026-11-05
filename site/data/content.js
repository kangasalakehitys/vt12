// Sivuston, PowerPointin ja PDF:n yhteinen sisältö. Muuta tekstit ja luvut vain tähän tiedostoon.
// Toimii sekä selaimessa (window.CONTENT) että Node-skripteissä (require).
(function (root) {
  const CONTENT = {
    meta: {
      title: 'Vt 12 Alasjärvi–Huutijärvi',
      subtitle: 'Suomen kannattavin yhteysvälihanke',
      org: 'Kangasalan kaupunki',
      updated: 'Marraskuu 2026'
    },

    hero: {
      kicker: 'Vt 12 Alasjärvi–Huutijärvi',
      title: 'Suomen kannattavin yhteysvälihanke',
      lead: 'Maan vilkkain kaksikaistainen pääväylä parannetaan nelikaistaiseksi. Hanke on toteutusvalmis vuonna 2027.',
      stats: [
        { value: '2,85', label: 'Hyöty-kustannussuhde (H/K)' },
        { value: '14 km', label: 'Tieosuus 1+1 → 2+2' },
        { value: '123 M€', label: 'Kustannusarvio' },
        { value: '8', label: 'Eritasoliittymää parannetaan' },
        { value: '2027', label: 'Toteutusvalmius' }
      ]
    },

    overview: {
      title: 'Hanke lyhyesti',
      items: [
        'Kaksikaistaisen (1+1) moottoriliikennetien parantaminen nelikaistaiseksi (2+2)',
        '14 km pitkä tieosuus',
        '8 nykyisen eritasoliittymän parantaminen',
        'Meluntorjunnan parantaminen',
        'Jalankulku-, pyöräily- ja viheryhteyksien parantaminen'
      ],
      facts: [
        { head: 'Vaihe', lines: ['Tiesuunnittelu loppusuoralla', 'Toteutusvalmius 2027'] },
        { head: 'Kustannukset', lines: ['Kustannusarvio 123 M€', 'H/K 2,9'], note: 'Kustannusarvio ja kustannusjako tarkentuvat tiesuunnitelmassa keväällä 2027.' },
        { head: 'Näkymät', lines: ['Pirkanmaan kärkihanke', 'Investointiohjelman ”varasijalla yksi”'] }
      ],
      timeline: [
        { when: 'Nyt', what: 'Tiesuunnitelma loppusuoralla' },
        { when: 'Kevät 2027', what: 'Kustannusarvio ja kustannusjako tarkentuvat' },
        { when: '2027', what: 'Toteutusvalmius' },
        { when: '2027–2034', what: 'Investointiohjelmakausi' }
      ]
    },

    reasons: {
      title: 'Hankkeen perusteet',
      cards: [
        { icon: 'traffic', head: 'Maan vilkkain', text: 'kaksikaistainen pääväylä' },
        { icon: 'euro', head: 'Maan kannattavin', text: 'yhteysvälihanke' },
        { icon: 'clock', head: 'Päätieverkon pisin', text: 'sujuvuusongelmainen jakso' }
      ],
      more: [
        'Osa elintärkeää poikittaista kuljetusväylää Rauma–Kouvola (TEN-T, E16, sotilaallinen liikkuvuus)',
        'Voimakkaasti kasvava maankäyttö ylikuormittaa tieosuuden lähivuosina kestämättömästi'
      ]
    },

    capacity: {
      title: 'Kapasiteettiin nähden kaksinkertainen liikenne',
      capacity: 9000,
      kvlMin: 14000,
      kvlMax: 21000,
      kvl2050Max: 39300,
      bullets: [
        '1+1-kaistaisen tien kapasiteetti on noin 9 000 ajoneuvoa vuorokaudessa (Väyläviraston ohjeita 16/2021)',
        'Vt 12:lla keskimääräinen vuorokausiliikenne (KVL) on 14 000–21 000 ajoneuvoa',
        'Ysitien hankkeen saatua rahoituksen vt 12 on maan vilkkain kaksikaistainen pääväylä ja valtatie',
        'Liikennemäärien kasvuennuste vuoteen 2050 mennessä on 35–80 %'
      ]
    },

    simulation: {
      title: 'Liikenne 2026–2050 kartalla',
      lead: 'Simulaatio näyttää, miten liikenne kasvaa nykytilasta vuoden 2050 ennusteeseen. Valitse vuosi, jolloin tie on nelikaistainen, ja vertaa sujuvuutta kaksikaistaiseen tiehen.',
      note: 'Liikennemäärät: Vt 12 Alasjärvi–Huutijärvi tiesuunnitelma, nykytila ja ennuste 2050. Välivuodet on laskettu tasaisella kasvulla. 1+1-tien kapasiteetti 9 000 ajon./vrk (Väyläviraston ohjeita 16/2021). 2+2-tien kapasiteetiksi on oletettu havainnollistamista varten 45 000 ajon./vrk. Autojen määrä kartalla on suuntaa antava.'
    },

    bottleneck: {
      title: 'Koko päätieverkon pahin pullonkaula',
      bullets: [
        'Vt 12 välillä Tampere–Lahti on maan pisin sujuvuusongelmainen (HCM E–F) tiejakso. Käytännössä tämä tarkoittaa osuutta Alasjärvi–Huutijärvi.',
        'Maan viimeisiä kaksikaistaisia teitä, joilla on moottoritietason liikenne – ja jäljellä olevista ylivoimaisesti pisin tieosuus.',
        'Sujuvuus- ja ylikuormituskriteereillä koko maan päätieverkon pahin pullonkaula.'
      ],
      link: { text: 'Traficom: maanteiden pääväylien ja muun päätieverkon sujuvuusongelmat', href: 'https://tieto.traficom.fi/fi/tilastot/maanteiden-paavaylien-ja-muun-paatieverkon-sujuvuusongelmat' }
    },

    profitability: {
      title: 'Maan kannattavin yhteysvälihanke',
      bullets: [
        'H/K 2,85 on erinomainen kannattavuusluku väylähankkeelle',
        'Vertailukelpoisista yhteysvälihankkeista vt 12 on maan ylivoimainen ykkönen',
        'Koko maan lähes 200 tiesuunnittelukohteesta vt 12 on sijalla 5',
        'Edellä on vain pääkaupunkiseudun sisäisiä hankkeita sekä karkea esisuunnittelulaskelma Lahden seudulta'
      ],
      tableTitle: 'Vt 12 ja vertailukelpoiset hankkeet PRIO-hankearvioinnissa',
      tableSource: 'Lähde: Väyläviraston julkaisuja 33/2026 (Investointiohjelman 2027–2034 aineistoa), taulukot 2 ja 9 sekä hankekuvaukset. Toimivuus = Liikenne 12 -suunnitelman toimivuustavoitteen tehokkuus.',
      // hk ja toimivuus (null = ei esitetty julkaisun taulukoissa)
      rows: [
        { name: 'Vt 12 Alasjärvi–Huutijärvi (VE 1)', place: 'Tampere–Kangasala', hk: 2.85, func: 2.65, own: true },
        { name: 'Vt 12 Lahti–Kouvola, Joutjärvi–Uusikylä (VE 1)', place: 'Lahti', hk: 2.15, func: 1.52 },
        { name: 'Vt 4 Vaajakosken kohta (VE 2)', place: 'Jyväskylä', hk: 1.68, func: 1.55 },
        { name: 'Vt 2 Porin keskusta ja Vt 8 Tiiliruukin etl (VE 4)', place: 'Pori', hk: 1.64, func: 1.36 },
        { name: 'Vt 3 Kannelmäki–Kaivoksela, Kuninkaantammen etl', place: 'Helsinki', hk: 1.57, func: 1.35 },
        { name: 'Vt 25 Langansböle–Västerbacka (VE 2)', place: 'Raasepori', hk: 0.95, func: 0.90 },
        { name: 'Kt 67 ja vt 19 Kivisaari–Atria', place: 'Seinäjoki', hk: 0.87, func: 0.54 },
        { name: 'Vt 6 Kouvolan kohta, Keltti–Puhjo (VE 3)', place: 'Kouvola', hk: 0.76, func: 0.72 },
        { name: 'Vt 12 Risala–Mankala', place: 'Lahti ja Iitti', hk: 0.7, func: null },
        { name: 'Vt 25 Asemantien liittymän kohta', place: 'Vihti', hk: 0.62, func: 0.70 }
      ]
    },

    growth: {
      title: 'Vt 12 kytkeytyy isoon hankekokonaisuuteen',
      bullets: [
        'Kaupunkiseudun kasvu painottuu vahvasti etelään ja itään',
        'Kangasala on suhteellisesti koko maan kovimpia kasvajia (top 5)',
        'Vt 12:n toteutus on kynnysinvestointi monelle muulle hankkeelle',
        'Kaksikaistaisena vt 12 ei mahdollista kasvua'
      ]
    },

    business: {
      title: 'Vt 12 ja elinkeinoelämä',
      bullets: [
        'Raskas liikenne on vilkasta koko hankealueella: raskaan liikenteen KVL 650–1 000',
        'Nelikaistaistukselle on peruste jo ilman erittäin vilkasta paikallisliikennettäkin',
        'Satamakuljetukset Rauma–Kouvola-käytävällä',
        'Ruokakuljetukset: alkutuotanto ja jalostus, etenkin Saarioisten Sahalahden tehtaat',
        'Paikallinen teollisuus: Kallio, Lentola, välillisesti mm. Rusko, Tarastenjärvi ja tulevaisuudessa Saarenmaa',
        'Kehä II:n tulevat jatkeet'
      ]
    },

    environment: {
      title: 'Melusuojausta, pyöräväyliä ja taajamaliikenteen rauhoittamista',
      bullets: [
        'Ulkoilureittien alikulkuja ja pieneläintunneleita',
        'Kangasalan seudullinen pääpyörätie (1. vaihe Suorama–Liuttu) kulkee vt 12:n poikki',
        'Kirkkojärven Natura-alueen huomiointi: melun ja tien estevaikutuksen vähentäminen',
        'Liikenteen mallinnettu vähenemä Kangasalantiellä (st 339): tuhansia ajoneuvoja vuorokaudessa',
        'Melusuojaukselle on tarvetta pitkin hankealuetta'
      ]
    },

    defence: {
      title: 'Pirkanmaa ja sotilaallinen liikkuvuus',
      bullets: [
        'Vt 12 on osa pohjoismaisen varautumisstrategian kuljetuskäytäviä',
        'Osa TEN-T-verkkoa ja sotilaallisen liikkuvuuden (Milmob) käytävää'
      ]
    },

    closing: {
      title: 'Rahoitus kannattaviin hankkeisiin',
      text: 'Väyläverkon kehittämisessä tulisi keskittyä ainoastaan niihin hankkeisiin, joilla on Väyläviraston laskentamenetelmien mukaan hyvä hyöty-kustannussuhde ja jotka ovat siten yhteiskunnallisesti kannattavia investointihankkeita.',
      punch: 'Vt 12 Alasjärvi–Huutijärvi: H/K 2,85.',
      contact: 'Kangasalan kaupunki · kangasala.fi'
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
  else root.CONTENT = CONTENT;
})(typeof window !== 'undefined' ? window : globalThis);
