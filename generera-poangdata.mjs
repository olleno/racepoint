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

/* ---------- 3. hela säsongens evenemangskalender ----------

   Kalendern ovan har bara två sorters lopp: de som redan är körda (ur
   punktlistan) och de som ligger inom en dryg vecka (ur livetimingsidan).
   Resten av vintern syntes inte alls — inga störtlopp i Gardena, inga
   sydamerikanska lopp i oktober.

   FIS egen kalenderfeed (icalendar-feed-fis-events.html) är trasig, den
   svarar 404 på samtliga varianter. Enda vägen är att läsa månadssidorna.
   Det gör den här delen till den sköraste i hela bygget: ändrar FIS
   utseendet slutar avläsningen fungera. Därför är den inbakad i try/catch
   — går den sönder byggs sidan ändå, den blir bara utan säsongsöversikt.

   Evenemangen har inget codex, så de går INTE in i tävlingskalendern. De
   skrivs till en egen fil och visas som en egen lista, utan klickbarhet. */

const SLUTAR = SASONG + 2000;                       // 2027
const MANADER = ['Jan','Feb','Mar','Apr','May','Jun',
                 'Jul','Aug','Sep','Oct','Nov','Dec']
                 .reduce((o, n, i) => (o[n] = i + 1, o), {});
const GRENKOD = '(DH|SL|GS|SG|AC|PSL|PGS|KB|TE|SX|AT|PAR|TP|TC)';
const ARGREN  = new RegExp(`^(\\d+x)?${GRENKOD}(\\s+(\\d+x)?${GRENKOD})*$`);

function lasKalendersida(html, sasongsar) {
  const ut = [];
  for (const rad of html.split('class="table-row').slice(1)) {
    const bit = rad.slice(0, 5000);
    const id = (bit.match(/ id="(\d+)"/) || [])[1];
    if (!id) continue;
    // strippa taggarna och behåll bara det som ser ut som riktiga fält
    const d = bit.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ')
      .split('\n').map(s => s.trim())
      .filter(s => s && s.toLowerCase() !== 'live'
                     && !/[=?&<>]/.test(s) && !/^https?:/.test(s) && s.length < 80);

    // nationen är den enda trebokstavskoden som följs av "AL"
    let k = -1;
    for (let i = 1; i < d.length; i++)
      if (/^[A-Z]{3}$/.test(d[i]) && d[i + 1] === 'AL') { k = i; break; }
    if (k < 6) continue;

    // datumet står på plats 4, och tar två rutor när det korsar månadsskifte
    let dSlut = 5, datTxt = d[4];
    if (/-$/.test(d[4])) { datTxt = d[4] + ' ' + d[5]; dSlut = 6; }

    // grenkolumnen är första rutan efter datumet som bara innehåller grenkoder
    let p = -1;
    for (let i = dSlut; i < k; i++) if (ARGREN.test(d[i])) { p = i; break; }
    if (p < 0) continue;

    const grenTxt = d[p];
    const kat   = (d[p - 1] || '').replace(/\s*•\s*/g, '/');
    const plats = (p - 2 >= dSlut ? d[p - 2] : d[k - 1]) || '';
    const nat   = d[k];

    const ar  = m => (m >= 7 ? sasongsar - 1 : sasongsar);
    const iso = (dag, man) => `${ar(man)}-${String(man).padStart(2, '0')}-${String(dag).padStart(2, '0')}`;
    let start = null, slut = null, m;
    if ((m = datTxt.match(/^(\d{1,2})\s+([A-Z][a-z]{2})-\s*(\d{1,2})\s+([A-Z][a-z]{2})$/)))
      { start = iso(m[1], MANADER[m[2]]); slut = iso(m[3], MANADER[m[4]]); }
    else if ((m = datTxt.match(/^(\d{1,2})-(\d{1,2})\s+([A-Z][a-z]{2})$/)))
      { start = iso(m[1], MANADER[m[3]]); slut = iso(m[2], MANADER[m[3]]); }
    else if ((m = datTxt.match(/^(\d{1,2})\s+([A-Z][a-z]{2})$/)))
      { start = iso(m[1], MANADER[m[2]]); slut = start; }
    if (!start) continue;

    const grenar = [...new Set(grenTxt.match(new RegExp(GRENKOD, 'g')) || [])];
    ut.push([id, start, slut, plats, nat, kat, grenar.join(',')].join('|'));
  }
  return ut;
}

let evenemang = [];
try {
  const manader = [];
  for (let m = 7; m <= 12; m++) manader.push(`${String(m).padStart(2, '0')}-${SLUTAR - 1}`);
  for (let m = 1; m <= 6; m++)  manader.push(`${String(m).padStart(2, '0')}-${SLUTAR}`);

  for (const mm of manader) {
    const url = 'https://www.fis-ski.com/DB/alpine-skiing/calendar-results.html'
              + `?sectorcode=AL&seasoncode=${SLUTAR}&seasonmonth=${mm}`
              + '&eventselection=&saveselection=-1';
    const html = await (await fetch(url)).text();
    const rader = lasKalendersida(html, SLUTAR);
    const av = html.split('class="table-row').length - 1;
    console.log(`  kalender ${mm}: ${rader.length}/${av} rader`);
    evenemang.push(...rader);
  }
  // samma evenemang dyker upp i två månader när det korsar månadsskifte
  evenemang = [...new Map(evenemang.map(r => [r.split('|')[0], r])).values()]
                .sort((a, b) => a.split('|')[1].localeCompare(b.split('|')[1]));
} catch (e) {
  console.warn('Säsongskalendern gick inte att läsa:', e.message);
  evenemang = [];
}

if (evenemang.length) {
  writeFileSync(new URL('./fis-evenemang.js', import.meta.url),
`/* Skapad av generera-poangdata.mjs ${new Date().toISOString().slice(0, 10)}
   Hela säsongens evenemang, lästa ur FIS månadssidor. Har inget codex och
   är därför inte klickbara — de visar bara vad som är på gång i vinter.
   Fält: id | start | slut | plats | nation | kategori | grenar */

window.FIS_EVENEMANG = \`
${evenemang.join('\n')}
\`.trim();
`);
}

console.log(`Klart. ${cfg.lista}: ${poangrader.length} åkare, ${kalender.length} tävlingar, ${evenemang.length} evenemang.`);
