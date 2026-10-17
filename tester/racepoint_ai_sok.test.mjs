/* Tester för AI-sökpaketet (17 okt 2026). Körs mot den byggda sajten:

     node generera-webbplats.mjs          (bygger webbplats/)
     node --test tester/*.test.mjs         (kör testerna)

   Annan mapp än webbplats/: RP_WEBBPLATS=/sökväg node --test tester/*.test.mjs
   Inga paket behövs – bara Node 18 eller nyare. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const UT = process.env.RP_WEBBPLATS || join(REPO, 'webbplats');
const DOMAN = 'https://racepoint.net';
const las = rel => readFileSync(join(UT, rel), 'utf8');
const finns = rel => existsSync(join(UT, rel));

if(!existsSync(join(UT, 'index.html'))) throw new Error(`Hittar ingen byggd sajt i ${UT} – kör node generera-webbplats.mjs först`);

function allaHtml(dir = UT, ut = []){
  for(const f of readdirSync(dir)){
    const p = join(dir, f);
    if(statSync(p).isDirectory()) allaHtml(p, ut);
    else if(f.endsWith('.html')) ut.push(p);
  }
  return ut;
}
const HTML = allaHtml();
const text = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
const ldBlock = h => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);

/* Schema.org-typer vi använder. Allt annat är ett fel – då har någon lagt till
   en typ utan att tänka efter (t.ex. Review, som vi inte får ha). */
const TILLATNA = new Set(['Organization','WebSite','WebApplication','BreadcrumbList','ListItem','Person','SportsTeam',
  'SportsEvent','Place','PostalAddress','Dataset','DataDownload','Article']);
const KRAV = {
  Organization:['name'], WebSite:['name','url'], WebApplication:['name','url','applicationCategory'],
  BreadcrumbList:['itemListElement'], ListItem:['position','name','item'], Person:['name','identifier'],
  SportsTeam:['name','sport'], SportsEvent:['name','startDate','location'], Place:['name'],
  Dataset:['name','description','url'], DataDownload:['contentUrl','encodingFormat'], Article:['headline']
};
function kollaLd(o, fel, var_){
  if(Array.isArray(o)){ o.forEach(x => kollaLd(x, fel, var_)); return; }
  if(!o || typeof o !== 'object') return;
  if(o['@type']){
    const typ = o['@type'];
    if(!TILLATNA.has(typ)) fel.push(`${var_}: otillåten typ ${typ}`);
    for(const k of KRAV[typ] || []) if(o[k] == null || o[k] === '') fel.push(`${var_}: ${typ} saknar ${k}`);
    if(typ === 'BreadcrumbList') o.itemListElement.forEach((x, i) => {
      if(x.position !== i + 1) fel.push(`${var_}: brödsmula position ${x.position} på plats ${i + 1}`);
      if(!String(x.item).startsWith(DOMAN + '/')) fel.push(`${var_}: brödsmula pekar utanför sajten (${x.item})`);
    });
    if(typ === 'SportsEvent' && !/^\d{4}-\d{2}-\d{2}$/.test(o.startDate)) fel.push(`${var_}: startDate ${o.startDate}`);
  }
  if('aggregateRating' in o || 'review' in o) fel.push(`${var_}: betyg/recension i strukturerad data`);
  for(const [k, v] of Object.entries(o)) if(k !== '@context' && typeof v === 'object') kollaLd(v, fel, var_);
}

test('JSON-LD finns, går att läsa och använder bara giltiga schema.org-typer', () => {
  const fel = []; let utan = 0;
  for(const p of HTML){
    const h = readFileSync(p, 'utf8'), rel = p.slice(UT.length);
    const block = ldBlock(h);
    if(!block.length){ if(!/\/(lagg-till|guide|kontakt)\.html$/.test(rel)) utan++, fel.length < 30 && fel.push(`${rel}: ingen JSON-LD`); continue; }
    for(const b of block){
      let o; try{ o = JSON.parse(b); }catch(e){ fel.push(`${rel}: trasig JSON-LD`); continue; }
      if(o['@context'] !== 'https://schema.org') fel.push(`${rel}: fel @context`);
      kollaLd(o['@graph'] || o, fel, rel);
    }
  }
  assert.deepEqual(fel.slice(0, 30), [], `${fel.length} fel, ${utan} sidor utan JSON-LD`);
});

test('nyckelsidor har rätt sorts strukturerad data', () => {
  const typer = rel => ldBlock(las(rel)).flatMap(b => { const o = JSON.parse(b); return (o['@graph'] || [o]).map(x => x['@type']); });
  assert.ok(typer('index.html').includes('Organization') && typer('index.html').includes('WebSite'), 'startsidan: Organization + WebSite');
  assert.ok(typer('alpine-skiing/index.html').includes('WebApplication'), 'kalkylatorn: WebApplication');
  assert.ok(typer('alpine-skiing/ranking/index.html').includes('Dataset'), 'rankningen: Dataset');
  assert.ok(typer('api/index.html').includes('Dataset'), 'öppna data: Dataset');
  const lopp = readdirSync(join(UT, 'alpine-skiing/races')).find(f => f.endsWith('.html') && f !== 'index.html');
  assert.ok(typer('alpine-skiing/races/' + lopp).includes('SportsEvent'), 'tävlingssida: SportsEvent');
  assert.ok(typer('alpine-skiing/races/' + lopp).includes('BreadcrumbList'), 'tävlingssida: BreadcrumbList');
});

test('Organization säger samma sak som llms.txt och sidfoten', () => {
  const org = JSON.parse(ldBlock(las('index.html'))[0])['@graph'].find(x => x['@type'] === 'Organization');
  const llms = las('llms.txt'), fot = text(las('index.html'));
  const bolag = org.parentOrganization.name, orgnr = org.parentOrganization.identifier;
  for(const [namn, t] of [['llms.txt', llms], ['sidfoten', fot]]){
    assert.ok(t.includes(bolag) && t.includes(orgnr), `${namn} saknar ${bolag} ${orgnr}`);
    assert.ok(t.includes('not affiliated with FIS'), `${namn} saknar "not affiliated with FIS"`);
  }
  assert.ok(llms.includes(org.description), 'llms.txt ska inledas med samma beskrivning som Organization');
});

test('llms.txt och llms-full.txt finns, är ren text och länkar till flödet', () => {
  for(const f of ['llms.txt', 'llms-full.txt']){
    assert.ok(finns(f), f + ' saknas');
    const t = las(f);
    assert.ok(t.startsWith('# Race Point'), f + ' ska börja med en Markdown-rubrik');
    assert.ok(!/<html|<body|<div/i.test(t), f + ' ska inte vara HTML');
    assert.ok(t.includes(DOMAN + '/api/v1/index.json'), f + ' länkar inte till flödet');
    for(const m of t.matchAll(/\]\((https:\/\/racepoint\.net[^)]*)\)/g)){
      const rel = m[1].slice(DOMAN.length).replace(/^\//, '').replace(/\/$/, '/index.html') || 'index.html';
      assert.ok(finns(rel), `${f} länkar till ${m[1]} som inte finns i bygget`);
    }
  }
  assert.match(las('llms-full.txt'), /F-values and max points/);
});

test('robots.txt släpper in sökmotorer och AI-botar', () => {
  const r = las('robots.txt');
  for(const bot of ['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-User','Claude-SearchBot','PerplexityBot',
                    'Google-Extended','Bingbot','Applebot-Extended'])
    assert.match(r, new RegExp(`^User-agent: ${bot}\\nAllow: /$`, 'm'), bot);
  assert.ok(!/^Disallow: \/\s*$/m.test(r), 'ingen total spärr');
  assert.match(r, /^Sitemap: https:\/\/racepoint\.net\/sitemap\.xml$/m);
});

test('sitemap är komplett, har lastmod och håller sig under 50 000 per fil', () => {
  const karta = las('sitemap.xml');
  const filer = karta.includes('<sitemapindex') ? [...karta.matchAll(/<loc>https:\/\/racepoint\.net\/([^<]+)<\/loc>/g)].map(m => m[1]) : ['sitemap.xml'];
  const alla = [];
  for(const f of filer){
    const x = las(f);
    const loc = [...x.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><\/url>/g)].map(m => m[1]);
    assert.equal(loc.length, (x.match(/<url>/g) || []).length, f + ': varje adress ska ha lastmod');
    assert.ok(loc.length <= 50000, f + ' har fler än 50 000 adresser');
    alla.push(...loc);
  }
  assert.equal(new Set(alla).size, alla.length, 'dubbletter i sitemap');
  for(const a of ['/alpine-skiing/ranking/', '/alpine-skiing/how-fis-points-are-calculated/', '/api/'])
    assert.ok(alla.includes(DOMAN + a), a + ' saknas i sitemap');
  // varje byggd sida (utom formulär och kontakt) ska finnas i kartan
  const iKartan = new Set(alla);
  const saknas = HTML.map(p => DOMAN + p.slice(UT.length).replace(/index\.html$/, ''))
    .filter(u => !/(kontakt)\.html$/.test(u) && !iKartan.has(u));
  assert.deepEqual(saknas.slice(0, 10), [], `${saknas.length} sidor saknas i sitemap`);
});

/* En liten JSON Schema-kontroll (räcker för OpenAPI-beskrivningen vi skriver). */
function validera(v, s, rot, sti = '$', fel = []){
  if(s.$ref) s = s.$ref.split('/').slice(1).reduce((o, k) => o[k], rot);
  const typer = [].concat(s.type || []);
  const typ = v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;
  if(typer.length && !typer.includes(typ) && !(typ === 'integer' && typer.includes('number')))
    { fel.push(`${sti}: ${typ}, väntade ${typer.join('/')}`); return fel; }
  if(s.enum && !s.enum.includes(v)) fel.push(`${sti}: ${v} inte i enum`);
  if(s.pattern && typeof v === 'string' && !new RegExp(s.pattern).test(v)) fel.push(`${sti}: matchar inte ${s.pattern}`);
  if(typ === 'object' && s.properties){
    for(const k of s.required || []) if(!(k in v)) fel.push(`${sti}: saknar ${k}`);
    for(const [k, x] of Object.entries(v)) if(s.properties[k]) validera(x, s.properties[k], rot, `${sti}.${k}`, fel);
  }
  if(typ === 'array' && s.items) v.forEach((x, i) => fel.length < 20 && validera(x, s.items, rot, `${sti}[${i}]`, fel));
  return fel;
}

test('JSON-flödet validerar mot sin OpenAPI-beskrivning', () => {
  const api = JSON.parse(las('api/v1/openapi.json'));
  assert.equal(api.openapi, '3.1.0');
  const idx = JSON.parse(las('api/v1/index.json'));
  assert.deepEqual(validera(idx, {$ref: '#/components/schemas/Index'}, api), []);
  assert.ok(idx.sports.length >= 1);
  for(const sp of idx.sports){
    for(const [vad, schema] of [['races', 'Races'], ['clubs', 'Clubs']]){
      const rel = sp.endpoints[vad].slice(DOMAN.length + 1);
      const d = JSON.parse(las(rel));
      assert.deepEqual(validera(d, {$ref: '#/components/schemas/' + schema}, api), [], rel);
      assert.equal(d.count, d[vad].length, rel + ': count stämmer inte');
      for(const post of d[vad]){
        assert.ok(post.source && /^\d{4}-\d{2}-\d{2}$/.test(post.checked), rel + ': post utan källa och datum');
        assert.ok(finns(post.url.slice(DOMAN.length + 1)), rel + ': länk till sida som inte finns: ' + post.url);
      }
    }
  }
  const f = JSON.parse(las('api/v1/alpine-skiing/formula.json'));
  assert.deepEqual(validera(f, {$ref: '#/components/schemas/Formula'}, api), []);
  assert.ok(f.events.length >= 5 && f.categories.length >= 5);
});

test('flödet innehåller inga personuppgifter (åkarnamn eller födelseår)', () => {
  const api = JSON.parse(las('api/v1/openapi.json'));
  for(const s of ['Races', 'Clubs']){
    const egenskaper = Object.keys(api.components.schemas[s].properties[s.toLowerCase()].items.properties);
    for(const k of egenskaper) assert.ok(!/athlete_name|birth|born|fodd|competitor/i.test(k), `${s}.${k}`);
  }
  // inga fält utöver de beskrivna
  const idx = JSON.parse(las('api/v1/index.json'));
  for(const sp of idx.sports){
    const d = JSON.parse(las(sp.endpoints.races.slice(DOMAN.length + 1)));
    const tillatna = new Set(Object.keys(api.components.schemas.Races.properties.races.items.properties));
    for(const r of d.races) for(const k of Object.keys(r)) assert.ok(tillatna.has(k), `odokumenterat fält ${k}`);
  }
});

test('svaret först: åkar-, klubb- och tävlingssidor börjar med ett daterat svar', () => {
  const fel = [];
  for(const p of HTML){
    const rel = p.slice(UT.length);
    if(!/\/(athletes|clubs|races)\/[^/]+\.html$/.test(rel) || rel.endsWith('/index.html')) continue;
    const h = readFileSync(p, 'utf8');
    if(/This race has not been run yet/.test(h)) continue;   // kommande lopp: inget resultat att svara med
    const m = h.match(/<p class="svar">([\s\S]*?)<\/p>/);
    if(!m || !/\d{4}-\d{2}-\d{2}/.test(m[1]) || !/Source:/.test(m[1])) fel.push(rel);
    if(m && h.indexOf('<p class="svar">') > h.indexOf('<section')) fel.push(rel + ' (svaret står inte först)');
  }
  assert.deepEqual(fel.slice(0, 10), [], `${fel.length} sidor utan daterat svar först`);
});

test('inga förbjudna värdeord på någon sida', () => {
  const FORBJUDNA = /\b(bäst i test|testvinnare|vårt val|mest populär\w*|populärast\w*|topprankad\w*|nummer ett|mest klickad\w*|best in test|most popular|top[- ]rated|editor'?s choice|our pick|number one choice)\b/i;
  const fel = [];
  for(const p of HTML){ const m = text(readFileSync(p, 'utf8')).match(FORBJUDNA); if(m) fel.push(`${p.slice(UT.length)}: ${m[0]}`); }
  for(const f of ['llms.txt', 'llms-full.txt']){ const m = las(f).match(FORBJUDNA); if(m) fel.push(`${f}: ${m[0]}`); }
  assert.deepEqual(fel.slice(0, 10), []);
});

test('frågebanken: 30–50 frågor, och varje fråga med svarssida pekar på en sida som finns', () => {
  const fb = JSON.parse(readFileSync(join(REPO, 'data/ai-fragor.json'), 'utf8'));
  assert.ok(fb.fragor.length >= 30 && fb.fragor.length <= 50, `${fb.fragor.length} frågor`);
  const ids = new Set();
  for(const f of fb.fragor){
    assert.ok(f.id && !ids.has(f.id), 'unikt id'); ids.add(f.id);
    assert.ok(f.fraga && f.avsikt && f.status, `fråga ${f.id} saknar fält`);
    if(f.status === 'svarssida'){
      const rel = f.sida.replace(/^\//, '').replace(/\/$/, '/index.html') || 'index.html';
      assert.ok(finns(rel), `fråga ${f.id}: ${f.sida} finns inte i bygget`);
    } else assert.equal(f.status, 'saknar data', `fråga ${f.id}: okänd status`);
  }
  const ms = JSON.parse(readFileSync(join(REPO, 'data/ai-synlighet.json'), 'utf8'));
  for(const k of ['tjanster', 'klassning', 'regler', 'nyckeltal']) assert.ok(ms[k], 'mätprotokollet saknar ' + k);
});
