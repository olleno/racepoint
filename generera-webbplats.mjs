/* Bygger hela webbplatsen som vanliga HTML-sidor, en per tävling och en per
   åkare, med riktiga adresser som Google kan hitta.

   Kör:  node generera-webbplats.mjs
   Kräver Node 18 eller nyare. Inga paket behöver installeras.

   Resultatet hamnar i mappen webbplats/ och är färdigt att lägga upp:

     webbplats/
       index.html                     racepoint.net – startsidan
       stil.css                       gemensam formgivning
       robots.txt  sitemap.xml        så sökmotorerna hittar allt
       ikoner/  manifest.webmanifest
       alpine-skiing/
         index.html                   den levande sidan (välj tävling, live)
         sprak.js  fis-*.js           data den läser
         races/2026-09-07-chapelco-giant-slalom-men.html
         athletes/203114-nicolas-quintero.html
         ...

   Varför det här behövs: den levande sidan lägger allt bakom # i adressen,
   och då ser sökmotorer bara en enda sida. De statiska sidorna nedan är
   riktiga adresser med riktigt innehåll – det är de som ger trafik.       */

import { inflateRawSync } from 'node:zlib';
import { writeFileSync, mkdirSync, copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HAR = dirname(fileURLToPath(import.meta.url));
const UT  = join(HAR, 'webbplats');

/* Hämta färska nyhetsrubriker först, så de följer med i bygget. Går det inte
   – flödet nere, ingen nätverksåtkomst – byggs sajten ändå, med de rubriker
   som redan ligger i fis-nyheter.js. Nyheter får aldrig stoppa bygget. */
try{
  await import('./generera-nyheter.mjs');
}catch(e){
  console.log('Nyheter kunde inte hämtas den här gången ('+e.message+') – bygger vidare.');
}
const DOMAN = process.env.RP_DOMAN || 'https://racepoint.net';
const SASONG = 27;
const GRENAR = ['DH','SL','GS','SG','AC'];
const GRENNAMN = {DH:'Downhill', SL:'Slalom', GS:'Giant Slalom',
                  SG:'Super-G', AC:'Alpine Combined'};

/* ─────────────── zip och tabeller ─────────────── */
function zipFiler(buf){
  let eocd=-1;
  for(let i=buf.length-22;i>=0;i--){ if(buf.readUInt32LE(i)===0x06054b50){eocd=i;break;} }
  if(eocd<0) throw new Error('Ingen giltig zip');
  const antal=buf.readUInt16LE(eocd+10);
  let off=buf.readUInt32LE(eocd+16);
  const filer={};
  for(let k=0;k<antal;k++){
    const nl=buf.readUInt16LE(off+28), el=buf.readUInt16LE(off+30), cl=buf.readUInt16LE(off+32);
    const namn=buf.slice(off+46,off+46+nl).toString();
    const comp=buf.readUInt32LE(off+20), lho=buf.readUInt32LE(off+42);
    const lnl=buf.readUInt16LE(lho+26), lel=buf.readUInt16LE(lho+28);
    const start=lho+30+lnl+lel;
    filer[namn]=inflateRawSync(buf.slice(start,start+comp)).toString('utf8');
    off+=46+nl+el+cl;
  }
  return filer;
}
const tabell = txt => {
  const rader=txt.trim().split('\r\n'), rubrik=rader[0].split('\t');
  return rader.slice(1).map(r=>{ const c=r.split('\t'), o={};
    rubrik.forEach((k,i)=>o[k]=c[i]); return o; });
};

/* ─────────────── små hjälpare ─────────────── */
const esc = t => String(t==null?'':t).replace(/[&<>"]/g,
  c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function slug(s){
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/ø/gi,'o').replace(/æ/gi,'ae').replace(/ß/g,'ss').replace(/đ/gi,'d')
    .replace(/ł/gi,'l').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);
}
const ISO={AND:'AD',ALB:'AL',ARG:'AR',ARM:'AM',AUS:'AU',AUT:'AT',AZE:'AZ',BEL:'BE',BIH:'BA',
 BLR:'BY',BOL:'BO',BRA:'BR',BUL:'BG',CAN:'CA',CHI:'CL',CHN:'CN',CIV:'CI',COL:'CO',CRC:'CR',
 CRO:'HR',CYP:'CY',CZE:'CZ',DEN:'DK',DOM:'DO',ECU:'EC',EGY:'EG',ESP:'ES',EST:'EE',FIJ:'FJ',
 FIN:'FI',FRA:'FR',GBR:'GB',GEO:'GE',GER:'DE',GHA:'GH',GRE:'GR',GUA:'GT',HAI:'HT',HKG:'HK',
 HUN:'HU',IND:'IN',IRI:'IR',IRL:'IE',ISL:'IS',ISR:'IL',ITA:'IT',JAM:'JM',JPN:'JP',KAZ:'KZ',
 KEN:'KE',KGZ:'KG',KOR:'KR',KOS:'XK',LAT:'LV',LBN:'LB',LIE:'LI',LTU:'LT',LUX:'LU',MAD:'MG',
 MAR:'MA',MAS:'MY',MDA:'MD',MEX:'MX',MGL:'MN',MKD:'MK',MNE:'ME',MON:'MC',NED:'NL',NEP:'NP',
 NGR:'NG',NOR:'NO',NZL:'NZ',PAK:'PK',PER:'PE',PHI:'PH',POL:'PL',POR:'PT',PRK:'KP',PUR:'PR',
 ROU:'RO',RSA:'ZA',RUS:'RU',SGP:'SG',SLO:'SI',SMR:'SM',SRB:'RS',SUI:'CH',SVK:'SK',SWE:'SE',
 SYR:'SY',THA:'TH',TPE:'TW',TTO:'TT',TUR:'TR',UKR:'UA',URU:'UY',USA:'US',UZB:'UZ',VEN:'VE',
 VIE:'VN',ZIM:'ZW'};
function flagga(nat){
  const k=ISO[nat];
  if(!k) return '<span class="flag txt">'+esc(nat||'')+'</span>';
  return '<span class="flag">'+[...k].map(c=>String.fromCodePoint(0x1F1E6+c.charCodeAt(0)-65)).join('')+'</span>';
}
/* Förbund och klubbar: riktiga adresser om de står i fis-forbund.js,
   annars en färdig sökning. En sökning blir aldrig en trasig länk. */
const stubbe={};
try{
  const kod=readFileSync(join(HAR,'fis-forbund.js'),'utf8');
  new Function('window', kod)(stubbe);
}catch(e){ /* filen är valfri */ }
const FORBUND=stubbe.FIS_FORBUND||{}, KLUBBAR=stubbe.FIS_KLUBBAR||{};
/* sponsorerna hämtas ur samma fil som den levande sidan läser */
const mediaStubbe={};
try{
  new Function('window', readFileSync(join(HAR,'fis-media.js'),'utf8'))(mediaStubbe);
}catch(e){ /* filen är valfri */ }
const SPONSORER=(mediaStubbe.SIDSPONSORER||[])
  .filter(s=>s && s.adress && /^https?:\/\//i.test(s.adress));
/* Affiliate-partners. Rutan visas bara om någon är aktiv och ligger i en
   konfliktfri kategori – se kommentaren överst i fis-affiliate.js. */
const affStubbe={};
try{
  new Function('window', readFileSync(join(HAR,'fis-affiliate.js'),'utf8'))(affStubbe);
}catch(e){ /* filen är valfri */ }
const AFF=(affStubbe.FIS_AFFILIATE||[]).filter(p=>
  p.aktiv && !p.baraEgetVal && (affStubbe.FIS_AFFILIATE_FRIA||[]).includes(p.kategori) && p.adress);

/* Åkarnas egna länkar hämtas ur det publicerade arket redan vid bygget, så
   att de syns även för den som inte kör javascript – och för Google. */
const profStubbe={};
try{
  new Function('window', readFileSync(join(HAR,'fis-profiler.js'),'utf8'))(profStubbe);
}catch(e){ /* filen är valfri */ }
/* Varumärkeslogotyperna. Samma fil som sajten använder, så att en åkarsida
   och åkarkortet inne i appen ser likadana ut. */
const ikonStubbe={};
try{
  new Function('window', readFileSync(join(HAR,'fis-ikoner.js'),'utf8'))(ikonStubbe);
}catch(e){ /* utan filen blir det knappar utan logotyp, inget mer */ }
const IKON=ikonStubbe.FIS_IKONER||{};
const IKONOFF=ikonStubbe.FIS_IKONER_OFF||{};

/* En knapp med märkets egen logotyp och egen färg. Tidigare stod de här
   som grå textlänkar, och en besökare såg varken att de gick att klicka på
   eller vart de ledde. Instagram har en färgtoning i stället för en färg. */
const IG_TONING='<svg width="0" height="0" style="position:absolute" aria-hidden="true">'+
  '<linearGradient id="rp-ig" x1="0" y1="1" x2="1" y2="0">'+
  '<stop offset="0" stop-color="#FDCB52"/><stop offset=".35" stop-color="#F5643B"/>'+
  '<stop offset=".7" stop-color="#D6249F"/><stop offset="1" stop-color="#7A34C1"/>'+
  '</linearGradient></svg>';
function kanalKnapp(typ, adress, etikett){
  const ik=IKON[typ];
  const namn=etikett||(ik?ik.namn:typ);
  /* Sponsorer och egna webbplatser får företagets egen sidikon när bygget
     lyckats hämta den – annars den ritade standardikonen. Ingen tom ruta. */
  const eget=(typ==='sponsor'||typ==='webb') ? akarSponsorMarke(adress) : null;
  const svg=eget
    ? '<img class="marke" src="'+eget+'" alt="" width="20" height="20" loading="lazy">'
    : (ik ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ik-'+esc(typ)+
        '" d="'+ik.d+'"/></svg>' : '');
  return '<a class="kanal" href="'+esc(adress)+'" rel="noopener nofollow">'+svg+
    '<span class="txt">'+esc(namn)+'</span><span class="chev">›</span></a>';
}
function offKnapp(nyckel, adress, text, akta){
  const svg=IKONOFF[nyckel]?'<svg viewBox="0 0 24 24" aria-hidden="true">'+
    '<path fill="currentColor" d="'+IKONOFF[nyckel]+'"/></svg>':'';
  return '<a class="kanal off" href="'+esc(adress)+'" rel="noopener'+
    (akta===false?' nofollow':'')+'">'+svg+'<span class="txt">'+esc(text)+
    '</span><span class="chev">›</span></a>';
}
function offTom(nyckel, text){
  const svg=IKONOFF[nyckel]?'<svg viewBox="0 0 24 24" aria-hidden="true">'+
    '<path fill="currentColor" d="'+IKONOFF[nyckel]+'"/></svg>':'';
  return '<span class="kanal off tomrad">'+svg+'<span class="txt">'+esc(text)+'</span></span>';
}

const PROFILKOL=['instagram','tiktok','youtube','facebook','linkedin','strava','webb'];
const PROFILBAS={instagram:'https://www.instagram.com/',tiktok:'https://www.tiktok.com/@',
  youtube:'https://www.youtube.com/@',facebook:'https://www.facebook.com/',
  linkedin:'https://www.linkedin.com/in/',strava:'https://www.strava.com/athletes/'};
/* Samma regler som i index.html – se kommentaren där. Kort: en punkt i
   texten betyder inte att det är en domän ("esther.nordberg" är ett
   Instagram-konto), och ett mellanslag betyder att åkaren skrev sitt namn
   i stället för sitt konto, och då blir det ingen länk alls. */
function heladress(typ,v){
  v=String(v||'').trim();
  if(!v) return '';
  if(/^https?:\/\//i.test(v)) return v;
  if(/^www\./i.test(v)) return 'https://'+v;
  const egenSida = (typ==='webb'||typ==='sponsor');
  if(/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}([/?#]|$)/i.test(v) && (egenSida || v.indexOf('/')>=0))
    return 'https://'+v;
  const bas=PROFILBAS[typ];
  if(!bas) return '';
  if(/\s/.test(v)) return '';
  return bas+v.replace(/^@/,'');
}
let PROFIL={};
try{
  const url=profStubbe.FIS_PROFIL_ARK;
  if(url){
    const txt=await (await fetch(url)).text();
    const rader=txt.split(/\r?\n/).filter(r=>r.trim());
    const prov=rader.slice(0,3).join('\n');
    const tecken=(prov.match(/\t/g)||[]).length>(prov.match(/,/g)||[]).length?'\t':',';
    const dela=r=>{ const ut=[]; let f='',i=0,cit=false;
      while(i<r.length){ const c=r[i];
        if(cit){ if(c==='"'){ if(r[i+1]==='"'){f+='"';i+=2;continue;} cit=false;i++;continue; } f+=c;i++;continue; }
        if(c==='"'){cit=true;i++;continue;}
        if(c===tecken){ut.push(f.trim());f='';i++;continue;}
        f+=c;i++; }
      ut.push(f.trim()); return ut; };
    const rubrik=dela(rader[0]).map(c=>c.toLowerCase());
    const kol=x=>rubrik.indexOf(x);
    const iF=kol('fis');
    if(iF>=0) rader.slice(1).forEach(r=>{
      const c=dela(r), fis=String(c[iF]||'').replace(/\D/g,'');
      if(!fis) return;
      const post={sociala:[], sponsorer:[], kontakt:false};
      PROFILKOL.forEach(namn=>{ const j=kol(namn); const a=heladress(namn, j>=0?c[j]:'');
        if(a) post.sociala.push({typ:namn, adress:a}); });
      ['sponsor1','sponsor2','sponsor3'].forEach(namn=>{
        const j=kol(namn); const v=j>=0?c[j]:''; if(!v) return;
        const m=v.match(/^(.*?)[\s–—-]+((?:https?:\/\/|www\.)\S+)$/);
        const a=heladress('webb', m?m[2]:v);
        if(a) post.sponsorer.push({namn:m?m[1].trim():'', adress:a}); });
      const iK=kol('kontakt');
      post.kontakt = iK>=0 && /^(ja|yes|x|1|true)$/i.test(String(c[iK]||'').trim());
      PROFIL[String(+fis)]=post;
    });
    console.log(`Hämtade egna länkar för ${Object.keys(PROFIL).length} åkare`);
  }
}catch(e){ console.log('Kunde inte hämta åkarnas länkar ('+e.message+') – bygger vidare.'); }

/* ── Sponsorernas egna märken ─────────────────────────────────────────────
   Instagram och Facebook har vi ritade logotyper för. Åkarnas sponsorer kan
   vara vilket företag som helst i vilken stad som helst, så dem går inte
   att rita i förväg. I stället hämtar bygget varje sponsors egen sidikon
   en gång och bakar in den i sidan.

   Varför inbakad och inte länkad: en bild som hämtas från sponsorns server
   varje gång någon öppnar en åkarsida talar om för sponsorn vem som tittar,
   gör sidan långsammare, och blir ett tomt hål den dagen de flyttar filen.
   Inbakad syns den alltid, och besökaren lämnar inga spår.

   Går något fel – långsam server, ingen ikon, konstigt filformat – blir det
   ingen bild alls, och knappen får sitt vanliga utseende. Aldrig ett fel
   som stoppar bygget. */
const SPONSORMARKE={};
/* Många företagssajter svarar inte på ett anrop utan webbläsarhuvuden – de
   tar det för en robot och stänger dörren. Rossignol var ett sådant fall:
   ikonerna fanns, men hämtningen kom aldrig fram. Vi presenterar oss därför
   som en vanlig webbläsare, precis som en besökare hade gjort. */
const HUVUD={
  'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '+
               '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept':'text/html,application/xhtml+xml,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language':'en;q=0.9'
};
async function hamtaMarke(bas){
  const svar=await fetch(bas, {redirect:'follow', headers:HUVUD,
                               signal:AbortSignal.timeout(8000)});
  const html=await svar.text();
  const kandidater=[];
  for(const m of html.matchAll(/<link\b[^>]*>/gi)){
    const t=m[0];
    if(!/rel\s*=\s*["'][^"']*icon/i.test(t)) continue;
    const h=(t.match(/href\s*=\s*["']([^"']+)["']/i)||[])[1];
    if(!h) continue;
    const stor=/apple-touch/i.test(t) ? 3 : (/\b(180|192|512)x/.test(t) ? 2 : 1);
    kandidater.push({url:new URL(h, svar.url).href, vikt:stor});
  }
  kandidater.push({url:new URL('/favicon.ico', svar.url).href, vikt:0});
  kandidater.sort((a,b)=>b.vikt-a.vikt);

  for(const k of kandidater.slice(0,4)){
    try{
      const b=await fetch(k.url, {redirect:'follow', headers:HUVUD,
                                  signal:AbortSignal.timeout(8000)});
      if(!b.ok) continue;
      const typ=(b.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
      if(!/^image\/(png|jpeg|svg\+xml|x-icon|vnd\.microsoft\.icon|webp|gif)$/.test(typ)) continue;
      const buf=Buffer.from(await b.arrayBuffer());
      /* Gränsen. Rossignol serverar samma 75 kB-fil för alla storlekar,
         även den som utger sig för att vara 16×16 – en dåligt gjord ikon,
         men deras åkare ska inte straffas för det. 120 kB släpper in sådana
         och stoppar fortfarande det som är orimligt. Filen med märken
         hämtas bara när någon öppnar ett åkarkort, inte på varje besök,
         så den kostar ingenting för den som bara läser resultat. */
      if(!buf.length || buf.length>120000) continue;
      return `data:${typ};base64,${buf.toString('base64')}`;
    }catch(e){ /* nästa kandidat */ }
  }
  return null;
}
try{
  /* Vi läser den adress åkaren faktiskt angav, inte bara domänen. En
     startsida kan skicka vidare till en landsväljare eller en inloggning;
     sidan hon länkat till vet vi renderar. Märket sparas ändå per domän,
     så två åkare med samma sponsor delar en hämtning. */
  const varden=new Map();
  Object.values(PROFIL).forEach(p=>(p.sponsorer||[]).forEach(s=>{
    try{
      const v=new URL(s.adress).hostname.replace(/^www\./,'');
      if(!varden.has(v)) varden.set(v, s.adress);
    }catch(e){}
  }));
  for(const [vard, adress] of varden){
    try{
      const d=await hamtaMarke(adress);
      if(d) SPONSORMARKE[vard]=d;
      else console.log(`  inget märke hos ${vard}`);
    }catch(e){ console.log(`  ${vard} svarade inte (${e.message})`); }
  }
  console.log(`Hämtade märken för ${Object.keys(SPONSORMARKE).length} av ${varden.size} sponsorer`);
}catch(e){ console.log('Sponsorernas märken kunde inte hämtas – bygger vidare.'); }
const akarSponsorMarke = adress => {
  try{ return SPONSORMARKE[new URL(adress).hostname.replace(/^www\./,'')]||null; }
  catch(e){ return null; }
};

const sok = f => 'https://www.google.com/search?q='+encodeURIComponent(f);
function forbundLank(nat){
  const f=FORBUND[nat];
  return {namn: f?f.namn:`${nat} ski association`,
          webb: f?f.webb:sok(`${nat} national ski association alpine skiing`),
          akta: !!f};
}
/* FIS exporterar svenska klubbnamn utan å, ä och ö – "Maelaroearnas
   Alpina Skidklubb". Står klubben i registret med både namn och adress
   visar vi det riktiga namnet i stället; annars FIS stavning och en
   sökning, som åtminstone aldrig blir en trasig länk. */
function klubbLank(klubb,nat){
  if(!klubb) return null;
  const k=KLUBBAR[klubb];
  if(k && typeof k==='object')
    return {namn:k.namn||klubb, webb:k.webb||sok(`${klubb} ${nat} ski club`), akta:!!k.webb};
  return {namn:klubb, webb:k||sok(`${klubb} ${nat} ski club`), akta:!!k};
}

const tid = ms => { if(!ms) return ''; const s=ms/1000, m=Math.floor(s/60);
  const r=(s-m*60).toFixed(2).padStart(5,'0'); return m? m+':'+r : r; };
const namnVisning = (efter,forn) => (efter||'').toUpperCase()+' '+(forn||'');
const namnSnyggt  = (efter,forn) => (forn||'')+' '+(efter||'');

/* ─────────────── sidmall ─────────────── */
const SIGILL = `<svg width="38" height="38" viewBox="0 0 52 52" aria-hidden="true">
<circle cx="26" cy="26" r="25" fill="none" stroke="#12305a" stroke-width="1.6"/>
<circle cx="26" cy="26" r="21" fill="#12305a"/>
<path d="M12 33l7.5-11 5 7 6-9.5L38 33z" fill="#fff"/>
<rect x="12" y="35.4" width="26" height="2" rx="1" fill="#2f7fb8"/></svg>`;

function sida({titel, beskrivning, adress, rot, underrubrik, brodsmula, innehall, jsonld}){
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titel)}</title>
<meta name="description" content="${esc(beskrivning)}">
<link rel="canonical" href="${esc(DOMAN + adress)}">
<link rel="stylesheet" href="${rot}stil.css">
<link rel="icon" href="${rot}ikoner/ikon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="${rot}ikoner/apple-touch-icon.png">
<meta name="theme-color" content="#12305a">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titel)}">
<meta property="og:description" content="${esc(beskrivning)}">
<meta property="og:url" content="${esc(DOMAN + adress)}">
${jsonld ? '<script type="application/ld+json">'+JSON.stringify(jsonld)+'</script>' : ''}
</head>
<body>
<div class="wrap">
<header class="topprad">
  <a class="brand" href="${rot}">${SIGILL}<span class="wm"><b>Race Point</b>
  <span class="rule"></span><span>${esc(underrubrik||'Alpine Skiing')}</span></span></a>
</header>
${brodsmula ? '<nav class="brod">'+brodsmula+'</nav>' : ''}
${innehall}
<footer class="foot">
  <p>Race Point is made for the athletes and the athlete community — the people whose
  season these numbers decide. It is an independent site and is not affiliated with FIS.</p>
  <p>Times and start lists from FIS live timing, points and rankings from the official
  FIS points list.</p>
</footer>
</div>
</body>
</html>
`;
}

/* ─────────────── 1. hämta data ─────────────── */
console.log('Hämtar FIS punktlista …');
let zip=null, nummer=null;
for(let n=30;n>=1;n--){
  const svar=await fetch(`https://www.fis-ski.com/DB/v2/download/fis-list/ALFP${n}${SASONG}F.zip`);
  if(svar.ok){
    const b=Buffer.from(await svar.arrayBuffer());
    if(b.length>1000 && b.readUInt32LE(0)===0x04034b50){ zip=b; nummer=n; break; }
  }
}
if(!zip) throw new Error('Hittade ingen punktlista hos FIS');
const filer=zipFiler(zip);
const hitta = s => filer[Object.keys(filer).find(k=>k.endsWith(s))];
const hdr=tabell(hitta('hdr.csv'))[0];
const com=tabell(hitta('com.csv'));
const pts=tabell(hitta('pts.csv'));
const rac=tabell(hitta('rac.csv'));
const res=tabell(hitta('res.csv'));
console.log(`  ${hdr.Listname}: ${com.length} åkare, ${rac.length} tävlingar, ${res.length} resultat`);

console.log('Hämtar kommande tävlingar …');
const liveHtml=await (await fetch('https://www.fis-ski.com/DB/alpine-skiing/live.html')).text();
const kommande=[];
for(const bit of liveHtml.split('class="g-row"').slice(1)){
  const codex=(bit.match(/clip gray"[^>]*>\s*([0-9]{3,5})\s*</)||[])[1];
  const datum=(bit.match(/data-date="(\d{4}-\d{2}-\d{2})"/)||[])[1];
  if(!codex||!datum) continue;
  const t=bit.replace(/<[^>]+>/g,'\n').replace(/&nbsp;/g,' ')
             .split('\n').map(s=>s.trim()).filter(Boolean);
  const iNat=t.findIndex(x=>/^[A-Z]{3}$/.test(x));
  if(iNat<0) continue;
  // platsen står direkt efter codexnumret i raden
  const iCodex=t.findIndex(x=>x===String(codex));
  const plats=(iCodex>=0 ? t[iCodex+1] : t[3])||'';
  kommande.push({codex:String(codex).padStart(4,'0'), datum, plats, nat:t[iNat],
    kat:t[iNat+1]||'', grennamn:t[iNat+2]||'',
    kon:t.find(x=>x==='M'||x==='W')||'', tid:(bit.match(/data-time="([0-9:]{4,5})"/)||[])[1]||''});
}
console.log(`  ${kommande.length} kommande`);

/* ─────────────── 2. sortera datan ─────────────── */
/* FIS-filen kommer ur en databasexport där apostrofer är escapade: klubben
   heter "Saint Michael\\'s College" i filen. Utan den här städningen står
   bakstrecket kvar på sidan. */
const stada = t => String(t==null?'':t).replace(/\\(['"\\])/g,'$1').trim();

const tillFis={}, akare={};
com.forEach(c=>{
  const f=String(Number(c.Fiscode));
  tillFis[c.Competitorid]=f;
  akare[f]={fis:f, id:c.Competitorid, efter:stada(c.Lastname), forn:stada(c.Firstname),
            kon:c.Gender, fodd:(c.Birthdate||'').slice(0,4), nat:c.Nationcode,
            klubb:stada(c.Skiclub), poang:{}, rank:{}, resultat:[]};
});
pts.forEach(p=>{
  const a=akare[tillFis[p.Competitorid]]; if(!a) return;
  a.poang[p.Disciplinecode]=parseFloat(p.Fispoints);
  if(p.Position) a.rank[p.Disciplinecode]=parseInt(p.Position,10);
});

const tavlingar={};
rac.forEach(r=>{
  tavlingar[r.Raceid]={
    raceid:r.Raceid, codex:String(r.Racecodex).padStart(4,'0'), datum:r.Racedate,
    plats:r.Place, nat:r.Nationcode, kat:r.Catcode, gren:r.Disciplinecode,
    kon:r.Gender, penalty:r.Appliedpenalty, beraknad:r.Calculatedpenalty,
    live:r.Live==='1', resultat:[]
  };
});
res.forEach(r=>{
  const t=tavlingar[r.Raceid]; if(!t) return;
  const rad={pos:r.Position?parseInt(r.Position,10):null, bib:r.Bib,
    fis:String(Number(r.Fiscode)), namn:r.Competitorname, nat:r.Nationcode,
    status:r.Status, tid:r.Timetotint?parseInt(r.Timetotint,10)*10:null,
    slutpoang:r.Racepoints?parseFloat(r.Racepoints):null};
  t.resultat.push(rad);
  const a=akare[rad.fis];
  if(a) a.resultat.push({tavling:t, pos:rad.pos, status:rad.status, poang:rad.slutpoang});
});
Object.values(tavlingar).forEach(t=>t.resultat.sort((a,b)=>(a.pos||999)-(b.pos||999)));
Object.values(akare).forEach(a=>a.resultat.sort((x,y)=>
  y.tavling.datum.localeCompare(x.tavling.datum)));

/* adresser */
const tavlingAdress = t =>
  `/alpine-skiing/races/${t.datum}-${slug(t.plats)}-${slug(GRENNAMN[t.gren]||t.gren)}-${t.kon==='M'?'men':'women'}-${t.codex}.html`;
const akareAdress = a => `/alpine-skiing/athletes/${a.fis}-${slug(namnSnyggt(a.efter,a.forn))}.html`;

/* ─────────────── 3. skriv sidor ─────────────── */
if(existsSync(UT)) rmSync(UT,{recursive:true});
['','/alpine-skiing','/alpine-skiing/races','/alpine-skiing/athletes','/ikoner']
  .forEach(m=>mkdirSync(UT+m,{recursive:true}));

const adresser=[];
function skriv(adress, html){
  const fil=join(UT, adress.replace(/^\//,''));
  mkdirSync(dirname(fil),{recursive:true});
  writeFileSync(fil, html);
  adresser.push(adress);
}

/* ---- åkarsidor ---- */
/* Register över alla åkare, så att sökrutan på den levande sidan kan hitta
   dem. Utan det går 7 000 sidor inte att nå för någon som inte råkar tävla
   just i dag. Formen är avsiktligt kompakt – en rad per åkare. */
const register=[];
let antalAkare=0;
for(const a of Object.values(akare)){
  const grenar=GRENAR.filter(g=>a.poang[g]!=null);
  if(!grenar.length) continue;                 // ingen data, ingen sida
  const visa=namnSnyggt(a.efter,a.forn).trim();
  const basta=grenar.slice().sort((x,y)=>a.poang[x]-a.poang[y])[0];
  const adress=akareAdress(a);
  const beskrivning=`${visa} (${a.nat}) FIS points: `+
    grenar.map(g=>`${GRENNAMN[g]} ${a.poang[g].toFixed(2)}`).join(', ')+
    `. Ranking, results and live race points.`;

  /* Klubben slås upp här uppe, för namnet ska stå riktigt även i ingressen
     och inte bara på knappen längre ner. */
  const kl=klubbLank(a.klubb,a.nat);
  const klubbVisa=kl?kl.namn:a.klubb;

  let inneh=`<h1>${flagga(a.nat)} ${esc(visa)}</h1>
<p class="ingress">FIS code ${esc(a.fis)} · ${esc(a.nat)}${a.fodd?' · born '+esc(a.fodd):''}${klubbVisa?' · '+esc(klubbVisa):''}</p>
<section class="kort"><h2>FIS points</h2>
<div class="tblwrap"><table><tr><th>Event</th><th class="n">Points</th><th class="n">World ranking</th></tr>`;
  grenar.forEach(g=>{
    inneh+=`<tr><td>${GRENNAMN[g]}</td><td class="n">${a.poang[g].toFixed(2)}</td>`+
           `<td class="n muted">${a.rank[g]?'no. '+a.rank[g]:'–'}</td></tr>`;
  });
  inneh+=`</table></div>
<p class="not">Lower points are better. From ${esc(hdr.Listname)}, valid ${esc(hdr.Validfrom)} to ${esc(hdr.Validto)}.</p></section>`;

  if(a.resultat.length){
    inneh+=`<section class="kort"><h2>Results this period</h2><div class="tblwrap"><table>
<tr><th>Date</th><th>Race</th><th class="n">Pos</th><th class="n">FIS points</th></tr>`;
    a.resultat.slice(0,40).forEach(r=>{
      inneh+=`<tr><td class="muted">${esc(r.tavling.datum)}</td>`+
        `<td><a href="${esc(tavlingAdress(r.tavling))}">${esc(r.tavling.plats)} · ${GRENNAMN[r.tavling.gren]}</a></td>`+
        `<td class="n">${r.pos||esc(r.status||'')}</td>`+
        `<td class="n">${r.poang!=null?r.poang.toFixed(2):'–'}</td></tr>`;
    });
    inneh+=`</table></div></section>`;
  }

  const fb=forbundLank(a.nat);
  const egna=PROFIL[String(+a.fis)]||null;

  /* Åkarens egna kanaler först, under hennes eget namn. En besökare ska se
     direkt att det är hennes sida och inte en tabell ur ett register. */
  const sociala=(egna&&egna.sociala)||[];
  if(sociala.length || (egna && egna.sponsorer.length)){
    inneh+=IG_TONING+`<section class="kort"><h2>${esc(visa)}’s own links</h2>
<p class="not">The athlete's own channels — kept up to date by them, not by FIS.</p>`;
    if(sociala.length)
      inneh+=`<div class="kanaler">`+sociala.map(x=>
        kanalKnapp(x.typ, x.adress, x.typ==='webb'?'Own website':'')).join('')+`</div>`;
    /* Egna sponsorer i egen rubrik, aldrig ihopblandade med affiliate –
       annars ser det ut som att ett märke sponsrar henne när det inte gör det. */
    if(egna && egna.sponsorer.length)
      inneh+=`<h3 class="underrub">Sponsors</h3><div class="kanaler">`+
        egna.sponsorer.map(x=>kanalKnapp('sponsor', x.adress,
          x.namn||String(x.adress).replace(/^https?:\/\/(www\.)?/,''))).join('')+`</div>`;
    inneh+=`</section>`;
  }

  inneh+=`<section class="kort"><h2>FIS and club</h2><div class="kanaler bred">`+
    offKnapp('live','/alpine-skiing/','Live race points')+
    offKnapp('bio','https://www.fis-ski.com/DB/general/athlete-biography.html?sectorcode=AL&competitorid='+esc(a.id)+'&type=result','FIS biography')+
    offKnapp('forbund',fb.webb,fb.namn,fb.akta)+
    (kl?offKnapp('klubb',kl.webb,kl.namn,kl.akta):offTom('klubb','Club not listed by FIS'))+
    `</div></section>`;

  /* Utrustning och resa. Bara aktiva partners i konfliktfria kategorier, och
     alltid med utmärkning – reklam måste gå att känna igen. */
  if(AFF.length){
    inneh+=`<section class="kort"><h2>Equipment and travel</h2>
<p class="reklamnot">Advertising. Race Point earns a commission if you buy through these
links, and most of it goes to this athlete's club. You pay exactly the same price.</p>
<div class="lankar">`+AFF.map(x=>
      `<a href="${esc(String(x.adress).replace(/\{FIS\}/g, encodeURIComponent(a.fis)))}" `+
      `rel="noopener sponsored nofollow">${esc(x.namn)}`+
      (x.text?` <span class="sm">${esc(x.text)}</span>`:'')+`</a>`).join('')+
      `</div></section>`;
  }

  /* Sponsringsförfrågningar. Avstängd som standard – rutan finns bara för den
     som själv satt ja i arket. Är åkaren under 18 går kontakten till klubben,
     aldrig till barnet, och adressen visas aldrig här. */
  if(egna && egna.kontakt){
    const ung = a.fodd && (new Date().getFullYear() - Number(a.fodd)) < 18;
    inneh+=`<section class="kort"><h2>Sponsorship enquiries</h2>
<p class="not">${ung
  ? 'Enquiries go to the club, which passes them on. Nothing is sent directly to the athlete.'
  : 'Your message is forwarded. The address is never shown here.'}</p>
<div class="lankar"><a class="knapp" href="/alpine-skiing/kontakt.html?fis=${esc(a.fis)}">Get in touch</a></div>
</section>`;
  }

  /* Utan den här rutan hittar ingen åkare fram till formuläret, och då
     står profilerna tomma hur bra röret än fungerar. */
  inneh+=`<section class="kort dinsida"><h2>Is this you?</h2>
<p class="not">Add your social media and your sponsors to this page. It is free, it takes
a couple of minutes, and everything is checked before it appears.</p>
<div class="lankar"><a class="knapp" href="/alpine-skiing/lagg-till.html">Add your links</a>
<a class="knapp" href="/alpine-skiing/guide.html">Three ways to fund your season</a></div>
</section>`;

  skriv(adress, sida({
    titel:`${visa} – FIS points and results | Race Point`,
    beskrivning, adress, rot:'../../',
    brodsmula:`<a href="../../">Race Point</a> › <a href="../">Alpine Skiing</a> › Athletes`,
    innehall:inneh,
    jsonld:{'@context':'https://schema.org','@type':'Person', name:visa,
      nationality:a.nat, identifier:a.fis,
      sameAs:`https://www.fis-ski.com/DB/general/athlete-biography.html?sectorcode=AL&competitorid=${a.id}`}
  }));
  /* Klubben följer med i registret. Åkarkortet inne i appen hade den inte
     alls, och blev därför inkonsekvent mot den statiska åkarsidan: vissa
     åkare visade fyra länkar, andra två. Registret hämtas ändå när någon
     söker, så det kostar ingenting på förstasidan. */
  register.push([a.fis, visa, a.nat,
    adress.replace('/alpine-skiing/athletes/','').replace('.html',''),
    kl?kl.namn:'', kl?kl.webb:''].join('|'));
  antalAkare++;
}
console.log(`Skrev ${antalAkare} åkarsidor`);

/* Registret som en egen fil, hämtas först när någon börjar söka. */
register.sort((x,y)=>x.split('|')[1].localeCompare(y.split('|')[1],'sv'));
mkdirSync(join(UT,'alpine-skiing'),{recursive:true});
writeFileSync(join(UT,'alpine-skiing','fis-akare.js'),
`/* Skapad av generera-webbplats.mjs.
   fis|namn|nation|filnamn|klubb|klubbadress, en per rad. */
window.FIS_AKARE = ${JSON.stringify(register.join('\n'))};
`);
console.log(`Skrev register över ${register.length} åkare`);

/* Förteckning som Google kan gå igenom – annars hittar sökmotorerna aldrig
   in till de enskilda sidorna, eftersom sökrutan är javascript. */
const perNation={};
register.forEach(r=>{ const d=r.split('|'); (perNation[d[2]]=perNation[d[2]]||[]).push(d); });
let listaInneh=`<h1>Alpine skiing athletes</h1>
<p class="ingress">Every athlete on the current FIS points list, ${register.length} in total.
Find yours and see points, world ranking and results.</p>`;
Object.keys(perNation).sort().forEach(nat=>{
  listaInneh+=`<section class="kort"><h2>${flagga(nat)} ${esc(nat)} · ${perNation[nat].length}</h2>
<div class="lankar">`+perNation[nat]
    .map(d=>`<a href="${esc(d[3])}.html">${esc(d[1])}</a>`).join('')+`</div></section>`;
});
skriv('/alpine-skiing/athletes/index.html', sida({
  titel:'Alpine skiing athletes – FIS points and results | Race Point',
  beskrivning:`All ${register.length} athletes on the FIS alpine points list, with points, world ranking and results.`,
  adress:'/alpine-skiing/athletes/', rot:'../../',
  brodsmula:`<a href="../../">Race Point</a> › <a href="../">Alpine Skiing</a> › Athletes`,
  innehall:listaInneh
}));

/* ---- tävlingssidor: avgjorda ---- */
let antalTavling=0;
for(const t of Object.values(tavlingar)){
  if(!t.resultat.length) continue;
  const adress=tavlingAdress(t);
  const grennamn=GRENNAMN[t.gren]||t.gren;
  const konText=t.kon==='M'?"Men's":"Women's";
  const rubrik=`${konText} ${grennamn} – ${t.plats}`;
  const beskrivning=`${rubrik}, ${t.datum}. Full results, race points and the applied `+
    `penalty of ${t.penalty}. FIS codex ${t.codex}.`;

  let inneh=`<h1>${flagga(t.nat)} ${esc(rubrik)}</h1>
<p class="ingress">${esc(t.datum)} · ${esc(t.kat)} · FIS codex ${esc(t.codex)}</p>
<section class="kort"><h2>Penalty</h2><div class="nums">
<div><div class="n">${esc(t.penalty)}</div><small>applied</small></div>
<div><div class="n">${esc(t.beraknad)}</div><small>calculated</small></div>
<div><div class="n">${t.resultat.filter(r=>r.pos).length}</div><small>classified</small></div>
</div><p class="not">Each athlete's FIS points for this race are the race points plus the applied penalty.</p></section>
<section class="kort"><h2>Results</h2><div class="tblwrap"><table>
<tr><th class="n">Pos</th><th class="n">Bib</th><th></th><th>Athlete</th><th class="n">Time</th><th class="n">FIS points</th></tr>`;
  t.resultat.forEach(r=>{
    const a=akare[r.fis];
    const namn=a?namnSnyggt(a.efter,a.forn):r.namn;
    const lank=a?`<a href="../athletes/${a.fis}-${slug(namnSnyggt(a.efter,a.forn))}.html">${esc(namn)}</a>`:esc(namn);
    const medalj=r.pos&&r.pos<=3?` class="m${r.pos}"`:'';
    inneh+=`<tr><td class="n pos">${r.pos?`<span${medalj}>${r.pos}</span>`:'<span class="muted">'+esc(r.status||'')+'</span>'}</td>`+
      `<td class="n muted">${esc(r.bib||'')}</td><td>${flagga(r.nat)}</td>`+
      `<td>${lank}</td><td class="n">${tid(r.tid)}</td>`+
      `<td class="n">${r.slutpoang!=null?r.slutpoang.toFixed(2):'–'}</td></tr>`;
  });
  inneh+=`</table></div></section>
<section class="kort"><h2>Live</h2><p class="not">During a race, Race Point works out the penalty and every athlete's new FIS points after each finish.</p>
<div class="lankar"><a href="/alpine-skiing/#tavling/${esc(t.codex)}">Open live page</a></div></section>`;

  skriv(adress, sida({
    titel:`${rubrik}, ${t.datum} – results and penalty | Race Point`,
    beskrivning, adress, rot:'../../',
    brodsmula:`<a href="../../">Race Point</a> › <a href="../">Alpine Skiing</a> › Races`,
    innehall:inneh,
    jsonld:{'@context':'https://schema.org','@type':'SportsEvent', name:rubrik,
      startDate:t.datum, sport:'Alpine skiing',
      location:{'@type':'Place', name:t.plats, address:t.nat}}
  }));
  antalTavling++;
}

/* ---- tävlingssidor: kommande ----
   En tävling som redan är avgjord kan ligga kvar i FIS livelista. Vi hoppar
   över den då, annars får samma tävling två adresser – och två adresser med
   samma innehåll är det enda sättet att aktivt skada sig själv hos Google. */
const avgjordaNycklar=new Set(Object.values(tavlingar)
  .filter(t=>t.resultat.length).map(t=>t.codex+'|'+t.datum));
for(const k of kommande){
  if(avgjordaNycklar.has(k.codex+'|'+k.datum)) continue;
  const adress=`/alpine-skiing/races/${k.datum}-${slug(k.plats)}-${slug(k.grennamn)}-${k.kon==='M'?'men':'women'}-${k.codex}.html`;
  const konText=k.kon==='M'?"Men's":"Women's";
  const rubrik=`${konText} ${k.grennamn} – ${k.plats}`;
  const inneh=`<h1>${flagga(k.nat)} ${esc(rubrik)}</h1>
<p class="ingress">${esc(k.datum)} · ${esc(k.kat)} · FIS codex ${esc(k.codex)}${k.tid?' · first run '+esc(k.tid)+' local time':''}</p>
<section class="kort"><h2>Live race points</h2>
<p class="not">This race has not been run yet. During the race Race Point works out the
penalty and every athlete's new FIS points after each finish, instead of waiting days for FIS.</p>
<div class="lankar"><a href="/alpine-skiing/#tavling/${esc(k.codex)}">Open live page</a></div></section>`;
  skriv(adress, sida({
    titel:`${rubrik}, ${k.datum} – live FIS points | Race Point`,
    beskrivning:`${rubrik}, ${k.datum}. Live results, penalty and new FIS points as the race is run. FIS codex ${k.codex}.`,
    adress, rot:'../../',
    brodsmula:`<a href="../../">Race Point</a> › <a href="../">Alpine Skiing</a> › Races`,
    innehall:inneh,
    jsonld:{'@context':'https://schema.org','@type':'SportsEvent', name:rubrik,
      startDate:k.datum, sport:'Alpine skiing', eventStatus:'https://schema.org/EventScheduled',
      location:{'@type':'Place', name:k.plats, address:k.nat}}
  }));
  antalTavling++;
}
console.log(`Skrev ${antalTavling} tävlingssidor`);

/* ---- register över tävlingar ---- */
const allaTavlingar=[...kommande.filter(k=>!avgjordaNycklar.has(k.codex+'|'+k.datum))
  .map(k=>({datum:k.datum, plats:k.plats, nat:k.nat, kat:k.kat,
    gren:k.grennamn, kon:k.kon, codex:k.codex,
    adress:`/alpine-skiing/races/${k.datum}-${slug(k.plats)}-${slug(k.grennamn)}-${k.kon==='M'?'men':'women'}-${k.codex}.html`,
    kommande:true})),
  ...Object.values(tavlingar).filter(t=>t.resultat.length).map(t=>({datum:t.datum, plats:t.plats,
    nat:t.nat, kat:t.kat, gren:GRENNAMN[t.gren]||t.gren, kon:t.kon, codex:t.codex,
    adress:tavlingAdress(t), kommande:false}))]
  .sort((a,b)=>b.datum.localeCompare(a.datum));

/* Register över avgjorda tävlingar som har en färdig resultatsida.
   FIS tar bort livetimingen ungefär en månad efter loppet – utan det här
   hamnar man på "ingen livetiming" i stället för på resultatet. Listan låter
   den levande sidan länka rätt: gamla tävlingar går till resultatsidan. */
const arkiv={};
allaTavlingar.filter(t=>!t.kommande).forEach(t=>{ arkiv[t.codex+'|'+t.datum]=t.adress; });
mkdirSync(join(UT,'alpine-skiing'),{recursive:true});
/* ── Åkarnas länkar som en statisk fil ────────────────────────────────────
   Tidigare hämtade varje besökare arket direkt från Google när ett åkarkort
   öppnades. Två problem med det: Google stryper den sortens adress när
   trafiken ökar – och då försvinner sponsorer och sociala länkar tyst från
   korten, utan felmeddelande – och åkarkortet inne i appen kunde visa något
   annat än åkarens egen sida, som byggs en gång per natt.

   Nu läser bygget arket en gång och skriver in resultatet här. Besökaren rör
   aldrig Google. Priset är att en ändring i arket syns först vid nästa
   bygge, i stället för efter fem minuter – men då syns den överallt
   samtidigt, vilket är lättare att lita på. */
writeFileSync(join(UT,'alpine-skiing','fis-profildata.js'),
`/* Skapad av generera-webbplats.mjs ${new Date().toISOString().slice(0,10)}
   Åkarnas egna länkar, godkända i arket. Läses av sidan i stället för att
   varje besökare frågar Google. */
window.FIS_PROFILDATA = ${JSON.stringify(PROFIL)};
`);
console.log(`Skrev länkar för ${Object.keys(PROFIL).length} åkare`);

/* Samma märken till sidan inne i appen, så att ett åkarkort och en åkarsida
   ser likadana ut. Filen skrivs varje bygge och innehåller bara de sponsorer
   som någon åkare faktiskt lagt upp. */
writeFileSync(join(UT,'alpine-skiing','fis-sponsormarken.js'),
`/* Skapad av generera-webbplats.mjs ${new Date().toISOString().slice(0,10)}
   Sponsorernas egna sidikoner, inbakade så att inget hämtas från deras
   servrar när någon besöker en åkarsida. */
window.FIS_SPONSORMARKEN = ${JSON.stringify(SPONSORMARKE)};
`);

writeFileSync(join(UT,'alpine-skiing','fis-arkiv.js'),
`/* Skapad av generera-webbplats.mjs. Nyckel: codex|datum -> resultatsida. */
window.FIS_ARKIV = ${JSON.stringify(arkiv, null, 1)};
`);
console.log(`Skrev arkivregister med ${Object.keys(arkiv).length} tävlingar`);

let listInneh=`<h1>Alpine skiing</h1>
<p class="ingress">FIS points and penalty worked out while the race is still running.</p>
<section class="kort"><h2>Live</h2><div class="lankar">
<a href="/alpine-skiing/">Open the live page</a></div></section>
<section class="kort"><h2>Races</h2><div class="tblwrap"><table>
<tr><th>Date</th><th>Place</th><th></th><th>Event</th><th></th><th class="n">Codex</th></tr>`;
allaTavlingar.forEach(t=>{
  listInneh+=`<tr><td class="muted">${esc(t.datum)}</td>`+
    `<td><a href="${esc(t.adress)}">${esc(t.plats)}</a></td><td>${flagga(t.nat)}</td>`+
    `<td>${esc(t.gren)}</td><td class="muted">${t.kon==='M'?'men':'women'}</td>`+
    `<td class="n muted">${esc(t.codex)}</td></tr>`;
});
listInneh+=`</table></div></section>
<section class="kort"><h2>Athletes</h2>
<p class="not">${antalAkare} athletes with valid FIS points, each with their points,
world ranking and results. Find them through a race, or search for the name.</p></section>`;
skriv('/alpine-skiing/races/index.html', sida({
  titel:'Alpine skiing races – results, penalty and FIS points | Race Point',
  beskrivning:'Every FIS alpine race with live timing: results, applied penalty and the FIS points each athlete scored.',
  adress:'/alpine-skiing/races/', rot:'../../',
  brodsmula:`<a href="../../">Race Point</a> › <a href="../">Alpine Skiing</a>`,
  innehall:listInneh
}));

/* ---- startsidan för racepoints.com ---- */
/* FIS egna grenar, hämtade ur deras kalenderval (sectorcode). Grässkidor
   är med hos FIS men hoppas över här – det är ingen snösport. */
const grenarPaSidan=[
  {namn:'Alpine Skiing', adress:'alpine-skiing/', klar:true, farg:'alpint',
   text:'Live penalty and FIS points, race by race.'},
  {namn:'Cross-Country', adress:null, klar:false, farg:'langd', text:'Coming.'},
  {namn:'Ski Jumping', adress:null, klar:false, farg:'backe', text:'Coming.'},
  {namn:'Nordic Combined', adress:null, klar:false, farg:'nordisk', text:'Coming.'},
  {namn:'Freestyle & Ski Cross', adress:null, klar:false, farg:'freestyle', text:'Coming.'},
  {namn:'Snowboard', adress:null, klar:false, farg:'snowboard', text:'Coming.'},
  {namn:'Para Alpine Skiing', adress:null, klar:false, farg:'alpint', text:'Coming.'},
  {namn:'Para Cross-Country', adress:null, klar:false, farg:'langd', text:'Coming.'},
  {namn:'Para Snowboard', adress:null, klar:false, farg:'snowboard', text:'Coming.'},
  {namn:'Masters', adress:null, klar:false, farg:'masters', text:'Coming.'},
  {namn:'Telemark', adress:null, klar:false, farg:'telemark', text:'Coming.'},
  {namn:'Speed Skiing', adress:null, klar:false, farg:'speed', text:'Coming.'},
  {namn:'Freeride', adress:null, klar:false, farg:'freeride', text:'Coming.'}
];
let start=`<h1>Race points, while the race is running</h1>
<p class="ingress">Built for the athletes and the people around them — coaches, clubs,
parents and fans. The official points arrive days after a race. Race Point works out the
penalty and every athlete's new points after each finish, from the same live timing feed
the officials use.</p>
<div class="grenar">`;
grenarPaSidan.forEach(g=>{
  const st=`style="--sport:var(--gren-${g.farg})"`;
  start+= g.klar
    ? `<a class="gren" ${st} href="${g.adress}"><b>${esc(g.namn)}</b><span>${esc(g.text)}</span></a>`
    : `<div class="gren av" ${st}><b>${esc(g.namn)}</b><span>${esc(g.text)}</span></div>`;
});
start+=`</div>
<section class="kort"><h2>How the numbers are worked out</h2>
<p class="not">Race points follow the alpine formula, and the penalty follows FIS Points Rules
article 4.4. The calculation has been checked against 44 official races and reproduced the
published penalty exactly in every one.</p></section>`;
/* Logotypen ligger hos sponsorn själv. Laddar den inte visas namnet i text
   i stället, via onerror – då blir det aldrig en tom lucka. */
function sponsorMarke(s){
  const fall="this.style.display='none';"+
             "var t=this.parentNode.querySelector('.namn');if(t)t.hidden=false;";
  let h=`<a href="${esc(s.adress)}" rel="noopener sponsored nofollow">`;
  if(s.marke) h+=`<img class="marke" src="${esc(s.marke)}" alt="" onerror="this.style.display='none'">`;
  if(s.bild)  h+=`<img src="${esc(s.bild)}" alt="${esc(s.namn)}" `+
                 `style="height:${s.hojd||20}px" onerror="${fall}">`;
  h+=`<span class="namn"${s.bild?' hidden':''}>${esc(s.namn)}</span></a>`;
  return h;
}
if(SPONSORER.length){
  start+=`<div class="sponsorer"><h4>Powered by</h4><div class="rad">`+
    SPONSORER.map(sponsorMarke).join('')+`</div></div>`;
}
skriv('/index.html', sida({
  titel:'Race Point – live FIS points for snow sports',
  beskrivning:'FIS points and penalty worked out while the race is still running, from the official live timing feed.',
  adress:'/', rot:'', underrubrik:'Snow sports', innehall:start
}));

/* ---- den levande sidan och dess data ---- */
/* Databerarfilerna byts varje natt. Utan ett versionsnummer i adressen
   serverar webbläsaren gamla poäng och gamla texter i upp till tio minuter
   efter ett bygge – och den som råkar ha sidan öppen ser fel siffror. */
const VERSION=new Date().toISOString().slice(0,16).replace(/[-:T]/g,'');
['index.html','lagg-till.html','guide.html','kontakt.html','sprak.js','fis-kalender.js','fis-poangdata.js','fis-profiler.js',
 'fis-media.js','fis-forbund.js','fis-nyheter.js','fis-affiliate.js','fis-evenemang.js','fis-ikoner.js',
 'manifest.webmanifest'].forEach(f=>{
  if(!existsSync(join(HAR,f))) return;
  if(f.endsWith('.html')){
    const html=readFileSync(join(HAR,f),'utf8')
      .replace(/(<script src=")([a-z0-9-]+\.js)(")/g, `$1$2?v=${VERSION}$3`);
    writeFileSync(join(UT,'alpine-skiing',f), html);
  } else {
    copyFileSync(join(HAR,f), join(UT,'alpine-skiing',f));
  }
});
['ikon-192.png','ikon-512.png','ikon-maskbar-512.png','apple-touch-icon.png'].forEach(f=>{
  const kalla=join(HAR,'ikoner',f);
  if(existsSync(kalla)){
    copyFileSync(kalla, join(UT,'ikoner',f));
    mkdirSync(join(UT,'alpine-skiing','ikoner'),{recursive:true});
    copyFileSync(kalla, join(UT,'alpine-skiing','ikoner',f));
  }
});
adresser.push('/alpine-skiing/');
// guiden ska indexeras – den är sidans starkaste eget innehåll
adresser.push('/alpine-skiing/guide.html');
adresser.push('/alpine-skiing/lagg-till.html');

/* ---- stilmall ---- */
writeFileSync(join(UT,'stil.css'), `:root{--bg:#f4f6f8;--card:#fff;--ink:#0f1419;--ink2:#3d4753;
--muted:#6b7684;--line:#e4e8ec;--line2:#eef1f4;--accent:#0a5fbf;--accent-bg:#e8f0fb;
--sigill:#12305a;--shadow:0 1px 2px rgba(16,24,40,.05),0 1px 3px rgba(16,24,40,.06);
--gren-alpint:#0a5fbf;--gren-langd:#0f8a5f;--gren-backe:#6d4bd6;--gren-nordisk:#c2620a;
--gren-freestyle:#c62a72;--gren-snowboard:#0891a8;--gren-masters:#4c5a6b;
--gren-telemark:#7d6b23;--gren-speed:#b4213d;--gren-freeride:#3f6212;
--sport:var(--gren-alpint);
--guld:#9a7209;--guld-bg:#fdf4dd;--silver:#5d6672;--silver-bg:#eef1f5;
--brons:#96521f;--brons-bg:#fbeee2}
@media(prefers-color-scheme:dark){:root{--bg:#0d1014;--card:#161a1f;--ink:#e9edf2;--ink2:#c3cad3;
--muted:#8e99a6;--line:#252b32;--line2:#1d2228;--accent:#63a8ff;--accent-bg:#14243a;
--sigill:#dfe7f0;--shadow:0 1px 3px rgba(0,0,0,.4);
--gren-alpint:#63a8ff;--gren-langd:#3fc48f;--gren-backe:#a78bfa;--gren-nordisk:#f0a742;
--gren-freestyle:#f472b6;--gren-snowboard:#38bdd8;--gren-masters:#93a3b5;
--gren-telemark:#cbb85a;--gren-speed:#ff6b81;--gren-freeride:#a3d05a;
--guld:#e3bc4d;--guld-bg:#2b2513;--silver:#aab4c0;--silver-bg:#20262d;
--brons:#d59462;--brons-bg:#2b1f16}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
-webkit-font-smoothing:antialiased}
body::before{content:"";display:block;height:4px;
background:linear-gradient(90deg,var(--sport) 0%,var(--sport) 55%,#d92d20 55%,#d92d20 100%)}
.wrap{max-width:840px;margin:0 auto;padding:20px 16px 70px}
.topprad{margin-bottom:18px}
.brand{display:inline-flex;align-items:center;gap:12px;text-decoration:none;color:inherit}
.brand svg{display:block;flex:none}.brand .wm{line-height:1}
.brand .wm b{display:block;font-size:17px;font-weight:700;letter-spacing:.135em;
text-transform:uppercase;color:var(--sigill)}
.brand .wm .rule{display:block;height:1px;margin:6px 0 5px;background:var(--sigill);opacity:.35}
.brand .wm span{display:block;font-size:8px;font-weight:700;letter-spacing:.34em;
text-transform:uppercase;color:var(--sport)}
.brod{font-size:12.5px;color:var(--muted);margin-bottom:16px}
.brod a{color:var(--muted)}
h1{font-size:23px;font-weight:660;letter-spacing:-.01em;margin:0 0 6px;line-height:1.25}
.ingress{color:var(--muted);font-size:14px;margin:0 0 22px}
.kort{background:var(--card);border:1px solid var(--line);border-radius:12px;
padding:15px 17px;margin-bottom:14px;box-shadow:var(--shadow)}
.kort h2{font-size:11.5px;font-weight:620;text-transform:uppercase;letter-spacing:.07em;
color:var(--muted);margin:0 0 12px}
.not{font-size:12.5px;color:var(--muted);margin:12px 0 0}
.tblwrap{overflow-x:auto;margin:0 -17px;padding:0 17px}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line2);white-space:nowrap}
th{font-size:11px;font-weight:620;text-transform:uppercase;letter-spacing:.05em;
color:var(--muted);border-bottom-color:var(--line)}
tr:last-child td{border-bottom:0}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.muted{color:var(--muted)}
a{color:var(--accent)}
.flag{font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.flag.txt{font-size:11px;font-weight:700;color:var(--muted)}
.nums{display:flex;gap:28px;flex-wrap:wrap}
.nums .n{font-size:28px;font-weight:640;font-variant-numeric:tabular-nums;line-height:1.1}
.nums small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;
color:var(--muted);margin-top:2px}
.lankar{display:flex;flex-wrap:wrap;gap:8px}
.lankar a{display:inline-flex;text-decoration:none;font-size:13px;color:var(--ink2);
background:var(--line2);border-radius:8px;padding:7px 12px}
.lankar a:hover{background:var(--accent-bg);color:var(--accent)}
.grenar{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:22px}
.gren{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;
padding:15px 17px 15px 19px;text-decoration:none;color:inherit;box-shadow:var(--shadow);
border-left:4px solid var(--sport);transition:transform .12s ease}
.gren:hover{transform:translateY(-2px)}
.gren b{display:block;font-size:15px;font-weight:660;margin-bottom:3px;color:var(--sport)}
.gren span{font-size:12.5px;color:var(--muted)}
.gren.av{opacity:.45}
.gren.av b{color:var(--ink2)}
.kort h2{color:var(--sport)}
td.pos span{display:inline-flex;min-width:23px;height:23px;align-items:center;
justify-content:center;border-radius:7px;font-size:12.5px;font-weight:700;
font-variant-numeric:tabular-nums}
td.pos span.m1{background:var(--guld-bg);color:var(--guld)}
td.pos span.m2{background:var(--silver-bg);color:var(--silver)}
td.pos span.m3{background:var(--brons-bg);color:var(--brons)}
.sponsorer{margin-top:26px;padding:16px 20px 18px;border-radius:14px;
background:#fff;border:1px solid var(--line);box-shadow:var(--shadow);
border-top:3px solid var(--sport)}
.sponsorer h4{font-size:10.5px;font-weight:620;text-transform:uppercase;
letter-spacing:.14em;color:var(--muted);margin:0 0 14px}
.sponsorer .rad{display:flex;flex-wrap:wrap;gap:16px 34px;align-items:center}
.sponsorer a{display:inline-flex;align-items:center;gap:7px;text-decoration:none;
color:var(--ink);font-size:15px;font-weight:640;letter-spacing:-.01em;
transition:transform .15s}
.sponsorer a:hover{transform:translateY(-1px)}
.sponsorer img{width:auto;display:block}
.sponsorer img.marke{height:16px}
.sponsorer .namn{white-space:nowrap}
/* Åkarens egna kanaler som riktiga knappar med märkets logotyp och färg.
   Tidigare grå textlänkar under rubriken "Links" – det gick knappt att se
   att de gick att klicka på, än mindre vart de ledde. */
.kanaler{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:8px}
.kanal{display:flex;align-items:center;gap:10px;text-decoration:none;
background:var(--card);border:1px solid var(--line);border-radius:11px;padding:10px 12px;
color:var(--ink);font-size:14px;font-weight:560;
transition:border-color .12s, transform .12s, box-shadow .12s}
.kanal:hover{border-color:currentColor;transform:translateY(-1px);
box-shadow:0 2px 8px rgba(16,24,40,.09)}
.kanal svg,.kanal img.marke{flex:none;width:20px;height:20px;display:block;
object-fit:contain;border-radius:3px}
.kanal .txt{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Klubb- och förbundsnamn är långa. Hellre två rader än "Maelaroearnas …" */
.kanaler.bred{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.kanal.off .txt{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3}
.kanal .chev{flex:none;font-size:15px;color:var(--muted);line-height:1}
.kanal.off{color:var(--ink2);font-weight:500}
.kanal.off svg{color:var(--muted)}
.kanal.off:hover{border-color:var(--accent);color:var(--accent)}
.kanal.off:hover svg{color:var(--accent)}
.kanal.tomrad{border-style:dashed;color:var(--muted);cursor:default}
.kanal.tomrad:hover{border-color:var(--line);color:var(--muted);transform:none;box-shadow:none}
.underrub{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
color:var(--muted);margin:18px 0 8px}
/* Märkesfärgerna. Instagram har en toning, resten sin officiella färg. */
.ik-instagram{fill:url(#rp-ig)}
.ik-facebook{fill:#1877F2}
.ik-youtube{fill:#FF0000}
.ik-tiktok{fill:#000}
.ik-linkedin{fill:#0A66C2}
.ik-strava{fill:#FC4C02}
.ik-webb{fill:#0a5fbf}
.ik-sponsor{fill:#0a7a41}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]) .ik-tiktok{fill:#fff}
  :root:not([data-theme="light"]) .ik-webb{fill:#63a8ff}
  :root:not([data-theme="light"]) .ik-sponsor{fill:#4ec281}
}
:root[data-theme="dark"] .ik-tiktok{fill:#fff}
:root[data-theme="dark"] .ik-webb{fill:#63a8ff}
:root[data-theme="dark"] .ik-sponsor{fill:#4ec281}
.dinsida{border-top:3px solid var(--sport)}
.reklamnot{font-size:12px;line-height:1.55;color:var(--muted);margin:0 0 11px;
background:#fdf3e3;border-radius:8px;padding:8px 11px}
.lankar a .sm{color:var(--muted);font-weight:400}
.lank-tom{display:inline-flex;align-items:center;font-size:13px;color:var(--muted);
border:1px dashed var(--line);border-radius:8px;padding:6px 11px}
.lankar a.knapp{background:var(--sport);color:#fff;border-color:var(--sport);font-weight:620}
.lankar a.knapp:hover{filter:brightness(1.08)}
.foot{font-size:12px;color:var(--muted);margin-top:30px;line-height:1.7;
border-top:1px solid var(--line);padding-top:16px}
@media(max-width:640px){.wrap{padding:14px 12px 60px}h1{font-size:20px}
.kort{padding:13px}.tblwrap{margin:0 -13px;padding:0 13px}th,td{padding:8px 6px;font-size:13.5px}}
`);

/* ---- CNAME: talar om för GitHub Pages vilken domän sajten har ----
   Måste ligga med i det som publiceras, annars tappas den egna domänen
   varje gång jobbet lägger upp en ny version. */
writeFileSync(join(UT,'CNAME'), new URL(DOMAN).hostname + '\n');

/* ---- robots och sitemap ---- */
writeFileSync(join(UT,'robots.txt'),
`User-agent: *\nAllow: /\n\nSitemap: ${DOMAN}/sitemap.xml\n`);

const idag=new Date().toISOString().slice(0,10);
const karta='<?xml version="1.0" encoding="UTF-8"?>\n'+
 '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n'.replace('sitemap.org','sitemaps.org')+
 adresser.map(a=>`<url><loc>${DOMAN}${a.replace(/index\.html$/,'')}</loc><lastmod>${idag}</lastmod></url>`).join('\n')+
 '\n</urlset>\n';
writeFileSync(join(UT,'sitemap.xml'), karta);

console.log(`\nKlart. ${adresser.length} adresser i webbplats/`);
console.log(`Sitemap: ${DOMAN}/sitemap.xml`);
