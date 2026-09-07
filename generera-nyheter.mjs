/* Hämtar alpina nyheter från öppna flöden och skriver fis-nyheter.js,
   som alpinsidan läser.

   Kör:  node generera-nyheter.mjs
   Kräver Node 18 eller nyare. Inga paket behöver installeras.

   Vi hämtar bara rubrik, datum och länk – aldrig artikeltexten. Läsaren
   klickar vidare till källan, som får sitt besök. Det är så nyhetsflöden är
   tänkta att användas, och det håller oss utanför upphovsrättsdiskussioner.

   Listan nedan innehåller kandidater. Skriptet provar varje adress och
   behåller bara de som faktiskt svarar med ett giltigt flöde – en gissning
   som inte funkar kostar ingenting och försvinner tyst. Loggen visar vilka
   som gav träff, så listan kan snävas in med tiden.                        */

import { writeFileSync } from 'node:fs';

const KALLOR = [
  // Bekräftad: svarar med application/rss+xml
  {namn:'Ski Racing Media', url:'https://skiracing.com/feed/', sprak:'en'},

  // Kandidater – tas bort automatiskt om de inte svarar
  {namn:'FIS Alpine',            url:'https://www.fis-ski.com/en/alpine-skiing/rss', sprak:'en'},
  {namn:'GB Snowsport',          url:'https://gbsnowsport.com/feed/', sprak:'en'},
  {namn:'Snow Australia',        url:'https://snow.org.au/feed/', sprak:'en'},
  {namn:'Snow Sports NZ',        url:'https://snowsports.co.nz/feed/', sprak:'en'},
  {namn:'Svenska Skidförbundet', url:'https://www.skidor.com/rss', sprak:'sv'},
  {namn:'FISI',                  url:'https://www.fisi.org/feed/', sprak:'it'},
  {namn:'Skiweltcup.tv',         url:'https://www.skiweltcup.tv/feed/', sprak:'de'},
  {namn:'Ski Chrono',            url:'https://www.skichrono.com/feed', sprak:'fr'}
];

const ANTAL = 14;              // så många rubriker sparas
const TIMEOUT = 12000;

/* ---------- liten flödesläsare, utan paket ---------- */
const avKod = s => String(s)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/&#(\d+);/g, (_,n)=>String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_,n)=>String.fromCharCode(parseInt(n,16)))
  .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&nbsp;/g,' ')
  .replace(/\s+/g,' ').trim();

function taUt(block, taggar){
  for(const t of taggar){
    const m = block.match(new RegExp('<'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+t+'>','i'));
    if(m) return avKod(m[1]);
  }
  return '';
}
function lankUr(block){
  const atom = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  if(atom && /^https?:/.test(atom[1])) return atom[1];
  const rss = block.match(/<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i);
  if(rss) return avKod(rss[1]);
  return '';
}

function lasFlode(xml){
  const bitar = xml.split(/<item(?=[\s>])|<entry(?=[\s>])/i).slice(1);
  return bitar.map(b=>{
    const slut = b.search(/<\/item>|<\/entry>/i);
    const block = slut>0 ? b.slice(0,slut) : b;
    return {
      rubrik: taUt(block, ['title']),
      lank:   lankUr(block),
      datum:  taUt(block, ['pubDate','published','updated','dc:date'])
    };
  }).filter(x=>x.rubrik && /^https?:\/\//.test(x.lank));
}

async function hamta(url){
  const c = new AbortController();
  const t = setTimeout(()=>c.abort(), TIMEOUT);
  try{
    const r = await fetch(url, {signal:c.signal, redirect:'follow',
      headers:{'user-agent':'RacePointNewsBot/1.0 (+https://racepoint.net)'}});
    if(!r.ok) return null;
    const txt = await r.text();
    if(!/<rss|<feed|<channel/i.test(txt)) return null;
    return txt;
  }catch(e){ return null; }
  finally{ clearTimeout(t); }
}

/* ---------- hämta allt ---------- */
const alla = [];
const funkade = [], misslyckades = [];

for(const k of KALLOR){
  const xml = await hamta(k.url);
  if(!xml){ misslyckades.push(k.namn+' ('+k.url+')'); continue; }
  const poster = lasFlode(xml).slice(0, 8);
  if(!poster.length){ misslyckades.push(k.namn+' (tomt flöde)'); continue; }
  funkade.push(k.namn+' – '+poster.length+' rubriker');
  poster.forEach(p=>alla.push({...p, kalla:k.namn, sprak:k.sprak}));
}

/* dubbletter bort (samma rubrik från flera flöden), nyast först */
const sedda = new Set();
const nyheter = alla
  .map(n=>({...n, tid: Date.parse(n.datum) || 0}))
  .sort((a,b)=>b.tid-a.tid)
  .filter(n=>{ const nyckel=n.rubrik.toLowerCase().slice(0,60);
               if(sedda.has(nyckel)) return false; sedda.add(nyckel); return true; })
  .slice(0, ANTAL)
  .map(n=>({rubrik:n.rubrik.slice(0,140), lank:n.lank, kalla:n.kalla,
            datum: n.tid ? new Date(n.tid).toISOString().slice(0,10) : ''}));

/* Gav inget flöde träff är nätet nere eller källorna tillfälligt borta.
   Då rör vi inte fis-nyheter.js – gamla rubriker är bättre än inga. */
if(!nyheter.length){
  console.log('Inget flöde svarade – behåller de rubriker som redan finns.');
}else{
writeFileSync(new URL('./fis-nyheter.js', import.meta.url),
`/* Skapad av generera-nyheter.mjs ${new Date().toISOString().slice(0,16).replace('T',' ')}
   Rubrik, datum och länk från öppna nyhetsflöden. Ingen artikeltext –
   läsaren klickar vidare till källan. */

window.FIS_NYHETER = ${JSON.stringify(nyheter, null, 1)};
`);
}

console.log('Flöden som svarade:');
funkade.forEach(f=>console.log('  OK  '+f));
if(misslyckades.length){
  console.log('Svarade inte (hoppas över):');
  misslyckades.forEach(f=>console.log('  --  '+f));
}
console.log(nyheter.length
  ? `\nSkrev ${nyheter.length} nyheter till fis-nyheter.js`
  : `\nfis-nyheter.js lämnades orörd.`);
