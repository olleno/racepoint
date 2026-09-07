/* Hämtar färsk data från FIS och skriver om de två filerna som sidan läser:
     fis-poangdata.js   – FIS-poäng för alla åkare i alla grenar
     fis-kalender.js    – tävlingar att välja mellan

   Körs med:  node generera-poangdata.mjs
   Kräver Node 18 eller nyare. Inga paket behöver installeras. */

import { inflateRawSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SASONG = 27;                       // 27 = säsongen 2026/27
const GRENAR = ['DH', 'SL', 'GS', 'SG', 'AC'];
const GRENNAMN = {DH:'Downhill', SL:'Slalom', GS:'Giant Slalom',
                  SG:'Super G', AC:'Alpine Combined'};

/* ---------- packa upp en zip utan externa paket ---------- */
function zipFiler(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Ingen giltig zip');
  const antal = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const filer = {};
  for (let k = 0; k < antal; k++) {
    const nl = buf.readUInt16LE(off + 28), el = buf.readUInt16LE(off + 30),
          cl = buf.readUInt16LE(off + 32);
    const namn = buf.slice(off + 46, off + 46 + nl).toString();
    const comp = buf.readUInt32LE(off + 20);
    const lho  = buf.readUInt32LE(off + 42);
    const lnl = buf.readUInt16LE(lho + 26), lel = buf.readUInt16LE(lho + 28);
    const start = lho + 30 + lnl + lel;
    filer[namn] = inflateRawSync(buf.slice(start, start + comp)).toString('utf8');
    off += 46 + nl + el + cl;
  }
  return filer;
}

const tabell = txt => {
  const rader = txt.trim().split('\r\n');
  const rubrik = rader[0].split('\t');
  return rader.slice(1).map(r => {
    const c = r.split('\t'), o = {};
    rubrik.forEach((k, i) => o[k] = c[i]);
    return o;
  });
};

/* ---------- 1. hämta senaste punktlistan ---------- */
let zip = null, nummer = null;
for (let n = 30; n >= 1; n--) {
  const svar = await fetch(
    `https://www.fis-ski.com/DB/v2/download/fis-list/ALFP${n}${SASONG}F.zip`);
  if (svar.ok) {
    const b = Buffer.from(await svar.arrayBuffer());
    if (b.length > 1000 && b.readUInt32LE(0) === 0x04034b50) { zip = b; nummer = n; break; }
  }
}
if (!zip) throw new Error('Hittade ingen punktlista hos FIS');

const filer = zipFiler(zip);
const hitta = s => filer[Object.keys(filer).find(k => k.endsWith(s))];
const hdr = tabell(hitta('hdr.csv'))[0];
const com = tabell(hitta('com.csv'));
const pts = tabell(hitta('pts.csv'));
const dis = tabell(hitta('dis.csv'));
const cat = tabell(hitta('cat.csv'));
const rac = tabell(hitta('rac.csv'));
const fiscat = hitta('Fiscategory.txt').split(/\r?\n/).slice(1);

const niva = {};
fiscat.forEach(r => { const c = r.split('\t'); if (c[1] === 'AL') niva[c[2]] = Number(c[7]); });

const cfg = {
  lista: hdr.Listname,
  giltig: hdr.Validfrom + '..' + hdr.Validto,
  dis: dis.map(d => [d.Disciplinecode, d.Gender, +d.Fvalue, +d.Maxpoints,
                     +d.Adder0, +d.Adder1, +d.Adder2, +d.Adder3, +d.Adder4]),
  min: Object.fromEntries(cat.map(c => [c.Catcode, parseFloat(c.Minfispoints)])),
  lvl: niva
};

const tillFis = {}, tillId = {};
com.forEach(c => { const f = String(Number(c.Fiscode)); tillFis[c.Competitorid] = f;
                   tillId[f] = c.Competitorid; });

const poang = {};
pts.forEach(p => {
  const f = tillFis[p.Competitorid];
  if (!f) return;
  (poang[f] = poang[f] || {})[p.Disciplinecode] = p.Fispoints + '/' + (p.Position || '');
});

// en rad per åkare: "fiskod internt-id DH SL GS SG AC"
// där varje gren är "poäng/placering i världen", eller - om poäng saknas
const poangrader = Object.keys(poang).sort((a, b) => a - b).map(f =>
  f + ' ' + tillId[f] + ' ' + GRENAR.map(g => poang[f][g] == null ? '-' : poang[f][g]).join(' '));

writeFileSync(new URL('./fis-poangdata.js', import.meta.url),
`/* Skapad av generera-poangdata.mjs ${new Date().toISOString().slice(0, 10)}
   Källa: FIS officiella punktlista ALFP${nummer}${SASONG}F.zip – ${cfg.lista} */

window.FIS_CFG = ${JSON.stringify(cfg, null, 2)};

(function () {
  var grenar = ${JSON.stringify(GRENAR)};
  var rader = ${JSON.stringify(poangrader.join('\n'))};
  var poang = {}, idn = {}, plats = {};
  rader.split('\\n').forEach(function (rad) {
    var d = rad.split(' '), p = {}, pl = {};
    for (var i = 0; i < grenar.length; i++) {
      var v = d[i + 2];
      if (v && v !== '-') {
        var t = v.split('/');
        p[grenar[i]] = parseFloat(t[0]);
        if (t[1]) pl[grenar[i]] = parseInt(t[1], 10);
      }
    }
    poang[d[0]] = p;
    plats[d[0]] = pl;
    idn[d[0]] = d[1];
  });
  window.FIS_POINTS = poang;
  window.FIS_RANK = plats;
  window.FIS_ID = idn;
})();
`);

/* ---------- 2. bygg tävlingskalendern ---------- */
// kommande och pågående lopp: FIS egen livetiming-sida
const liveHtml = await (await fetch('https://www.fis-ski.com/DB/alpine-skiing/live.html')).text();
const kommande = [];
for (const bit of liveHtml.split('class="g-row"').slice(1)) {
  const codex = (bit.match(/clip gray"[^>]*>\s*([0-9]{3,5})\s*</) || [])[1];
  if (!codex) continue;
  const datum = (bit.match(/data-date="(\d{4}-\d{2}-\d{2})"/) || [])[1] || '';
  const tid   = (bit.match(/data-time="([0-9:]{4,5})"/) || [])[1] || '';
  const t = bit.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ')
               .split('\n').map(s => s.trim()).filter(Boolean);
  const iNat = t.findIndex(x => /^[A-Z]{3}$/.test(x));
  if (iNat < 0 || !datum) continue;
  kommande.push([codex, datum, t[3] || '', t[iNat], t[iNat + 1] || '',
                 t[iNat + 2] || '', t.find(x => x === 'M' || x === 'W') || '', tid].join('|'));
}

/* Avgjorda lopp ur punktlistan – ALLA, inte bara de som hade livetiming.
   Tidigare stod här ett filter på Live === '1', och det gömde drygt hälften
   av loppen: störtlopp, kombination och alla tävlingar som körts utan
   livetiming syntes aldrig i kalendern. */
const avgjorda = rac
  .sort((a, b) => b.Racedate.localeCompare(a.Racedate))
  .map(r => [String(r.Racecodex).padStart(4, '0'), r.Racedate, r.Place, r.Nationcode,
             r.Catcode, GRENNAMN[r.Disciplinecode] || r.Disciplinecode, r.Gender, ''].join('|'));

// slå ihop, ta bort dubbletter på codex + datum
const kalender = [...new Map([...kommande, ...avgjorda]
  .map(r => [r.split('|')[0] + r.split('|')[1], r])).values()];

writeFileSync(new URL('./fis-kalender.js', import.meta.url),
`/* Skapad av generera-poangdata.mjs ${new Date().toISOString().slice(0, 10)}
   Kommande lopp från FIS livetiming-sida, avgjorda ur punktlistan.
   Fält: codex | datum | plats | nation | kategori | gren | kön | starttid */

window.FIS_KALENDER = \`
${kalender.join('\n')}
\`.trim();
`);

console.log(`Klart. ${cfg.lista}: ${poangrader.length} åkare, ${kalender.length} tävlingar.`);
