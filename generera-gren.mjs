/* Bygger sidorna för en FIS-gren utöver alpint: åkare, klubbar, tävlingar och
   en översiktssida. Anropas från generera-webbplats.mjs, efter alpint och före
   sitemap, en gång per gren i GRENER nedan.

   FIS levererar längd, snowboard och freestyle i exakt samma filformat som
   alpint (com, pts, rac, res, hdr), så samma kod räcker för alla – det enda
   som skiljer är grenkoderna och vad loppen heter. Skillnaderna står i GRENER.

   Två regler:
   1. Alpint får aldrig falla på grund av en annan gren. Allt här är inbakat i
      try/catch i anroparen, och en gren som inte går att hämta hoppas över.
   2. En gren som en natt inte går att hämta från FIS ska inte försvinna från
      sajten. Därför publiceras FIS-filen på sajten själv (<gren>/fis-lista.zip),
      och nästa bygge faller tillbaka på den om FIS avvisar oss. Sidorna blir
      några dygn gamla i stället för att bli 404.

   Livekalkylatorn (penalty och nya poäng under loppet) är en egen sak och
   kommer per gren när formeln är kontrollerad mot riktiga resultat. */

export const GRENER = [
  { kod:'CC', mapp:'cross-country', namn:'Cross-Country', sport:'Cross-country skiing',
    lista:'https://www.fis-ski.com/DB/cross-country/fis-points-lists.html', prefix:'CCFP',
    discipliner:{DI:'Distance', SP:'Sprint'}, hogreBattre:false, live:true },
  /* Snowboard och freestyle: poängen delas ut efter placering, så HÖGRE är bättre –
     tvärtom mot alpint och längd. ST är Street Style (FIS egen åkarprofil, okt 2026). */
  { kod:'SB', mapp:'snowboard', namn:'Snowboard', sport:'Snowboarding',
    lista:'https://www.fis-ski.com/DB/snowboard/fis-points-lists.html', prefix:'SBFP',
    discipliner:{PAR:'Parallel', SBX:'Snowboard Cross', HP:'Halfpipe', SS:'Slopestyle', BA:'Big Air', ST:'Street Style'},
    hogreBattre:true, live:false },
  { kod:'FS', mapp:'freestyle', namn:'Freestyle & Ski Cross', sport:'Freestyle skiing',
    lista:'https://www.fis-ski.com/DB/freestyle-freeski/fis-points-lists.html', prefix:'FSFP',
    discipliner:{MO:'Moguls', AE:'Aerials', SX:'Ski Cross', HP:'Halfpipe', SS:'Slopestyle', BA:'Big Air', ST:'Street Style'},
    hogreBattre:true, live:false }
];

const HUVUD = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': 'application/zip,application/octet-stream,text/html,*/*;q=0.8',
  'Accept-Language': 'en;q=0.9'
};
const paus = ms => new Promise(r => setTimeout(r, ms));

/* Hämtar grenens senaste punktlista: först FIS listsida för att få rätt
   filnamn, sedan filen. Går det inte – förra nattens kopia på vår egen sajt. */
async function hamtaLista(g, h){
  const SASONG = h.SASONG, fel = [];
  const okZip = b => { if(b.length<1000 || b.readUInt32LE(0)!==0x04034b50) return false;
                       try{ h.zipFiler(b); return true; }catch(e){ return false; } };
  try{
    const html = await (await fetch(g.lista, {headers:HUVUD, signal:AbortSignal.timeout(30000)})).text();
    const re = new RegExp(g.prefix+'(\\d+)'+SASONG+'F\\.zip','g');
    const nr = [...new Set([...html.matchAll(re)].map(m=>Number(m[1])))].sort((a,b)=>b-a).slice(0,2);
    for(const n of nr){
      await paus(1500);
      const s = await fetch(`https://www.fis-ski.com/DB/v2/download/fis-list/${g.prefix}${n}${SASONG}F.zip`,
                            {headers:HUVUD, signal:AbortSignal.timeout(60000)});
      if(!s.ok){ fel.push(n+':'+s.status); continue; }
      const b = Buffer.from(await s.arrayBuffer());
      if(okZip(b)) return {zip:b, kalla:'FIS'};
      fel.push(n+':trasig');
    }
  }catch(e){ fel.push('FIS:'+(e.name||'fel')); }
  try{
    const s = await fetch(`${h.DOMAN}/${g.mapp}/fis-lista.zip`, {signal:AbortSignal.timeout(60000)});
    if(s.ok){ const b = Buffer.from(await s.arrayBuffer()); if(okZip(b)) return {zip:b, kalla:'reserv'}; }
  }catch(e){ fel.push('reserv:'+(e.name||'fel')); }
  throw new Error(`${g.namn}: ingen punktlista (${fel.join(' ')})`);
}

export async function byggGren(g, h){
  const {esc, slug, flagga, sida, skriv, tabell, zipFiler, forbundLank, klubbLank,
         offKnapp, offTom, namnSnyggt, writeFileSync, mkdirSync, join, UT} = h;
  const PROFIL = h.PROFIL || {}, kanalKnapp = h.kanalKnapp, IG_TONING = h.IG_TONING || '',
        sponsorNamn = h.sponsorNamnUrAdress || (x=>x);
  const {zip, kalla} = await hamtaLista(g, h);
  const filer = zipFiler(zip);
  const hitta = s => filer[Object.keys(filer).find(k=>k.endsWith(s))];
  const hdr = tabell(hitta('hdr.csv'))[0];
  const com = tabell(hitta('com.csv')), pts = tabell(hitta('pts.csv'));
  const rac = tabell(hitta('rac.csv')), res = tabell(hitta('res.csv'));
  const DISC = g.discipliner, KODER = Object.keys(DISC);
  const battre = (x,y) => g.hogreBattre ? y-x : x-y;   // sorterar bäst först
  const RIKTNING = g.hogreBattre ? 'Higher points are better' : 'Lower points are better';
  const M = g.mapp, BAS = `/${M}`;
  console.log(`${g.namn}: ${hdr.Listname} (${kalla}) – ${com.length} åkare, ${rac.length} lopp, ${res.length} resultat`);

  mkdirSync(join(UT, M), {recursive:true});
  writeFileSync(join(UT, M, 'fis-lista.zip'), zip);       // reserv för nästa natt

  const stada = t => String(t==null?'':t).replace(/\\(['"\\])/g,'$1').trim();
  const tillFis = {}, akare = {};
  com.forEach(c=>{
    const f = String(Number(c.Fiscode));
    tillFis[c.Competitorid] = f;
    akare[f] = {fis:f, id:c.Competitorid, efter:stada(c.Lastname), forn:stada(c.Firstname),
                kon:c.Gender, fodd:(c.Birthdate||'').slice(0,4), nat:c.Nationcode,
                klubb:stada(c.Skiclub), poang:{}, rank:{}, resultat:[]};
  });
  pts.forEach(p=>{
    const a = akare[tillFis[p.Competitorid]];
    if(!a || !p.Fispoints || !DISC[p.Disciplinecode]) return;
    a.poang[p.Disciplinecode] = parseFloat(p.Fispoints);
    if(p.Position) a.rank[p.Disciplinecode] = parseInt(p.Position,10);
  });

  /* Bara lopp som ger FIS-poäng får en egen sida. Sprintfinalerna ger inga
     poäng (det är kvalet som räknas) och skulle bara dubblera kvalets sida. */
  const lopp = {};
  rac.filter(r=>r.Validforfispoints==='1').forEach(r=>{
    lopp[r.Raceid] = {raceid:r.Raceid, codex:String(r.Racecodex).padStart(4,'0'), datum:r.Racedate,
      plats:stada(r.Place), nat:r.Nationcode, kat:r.Catcode, kon:r.Gender,
      namn:stada(r.Name || r.Description), penalty:r.Appliedpenalty, beraknad:r.Calculatedpenalty,
      resultat:[]};
  });
  res.forEach(r=>{
    const t = lopp[r.Raceid]; if(!t) return;
    t.resultat.push({pos:r.Position?parseInt(r.Position,10):null, bib:r.Bib, fis:String(Number(r.Fiscode)),
      namn:stada(r.Competitorname), nat:r.Nationcode, status:r.Status,
      tid:r.Timetot||r.Tot||'', poang:r.Racepoints?parseFloat(r.Racepoints):null});
  });

  /* ---- arkiv över avgjorda lopp (Olles beslut 14 okt 2026) ----
     Varje punktlista innehåller bara loppen sedan förra listan. Utan arkiv
     försvann alla tävlingssidor när FIS släppte en ny lista. Arkivet ligger på
     sajten själv (<gren>/lopp-arkiv.json): förra nattens arkiv hämtas, dagens
     lopp läggs till, och det nya arkivet publiceras. Lopp äldre än tre år
     rensas bort. Går arkivet inte att hämta byggs sidorna på dagens lista, och
     arkivet skrivs då INTE över – så nästa natt har det fortfarande allt. */
  const ARKIVFIL = 'lopp-arkiv.json';
  const grans = new Date(Date.now()-3*365*864e5).toISOString().slice(0,10);
  let arkiv = null;
  for(let forsok=1; forsok<=4 && !arkiv; forsok++){      // vår egen sajt – svarar nästan alltid, men prova några gånger
    try{
      const sv = await fetch(`${h.DOMAN}/${M}/${ARKIVFIL}`, {signal:AbortSignal.timeout(60000)});
      if(sv.ok) arkiv = await sv.json();
      else if(sv.status===404) arkiv = {lopp:[]};        // första gången: inget arkiv ännu
      else throw new Error('svar '+sv.status);
    }catch(e){
      console.log(`${g.namn}: arkivet kunde inte hämtas, försök ${forsok} (${e.message})`);
      if(forsok<4) await paus(10000*forsok);
    }
  }
  let franArkiv = 0;
  if(arkiv){
    for(const x of arkiv.lopp||[]){
      if(lopp[x.raceid] || x.datum < grans) continue;
      lopp[x.raceid] = {...x, resultat:(x.r||[]).map(d=>({pos:d[0], bib:d[1], fis:d[2], namn:d[3],
        nat:d[4], status:d[5], tid:d[6], poang:d[7]}))};
      franArkiv++;
    }
    const ut = Object.values(lopp).filter(t=>t.resultat.length && t.datum >= grans).map(t=>({
      raceid:t.raceid, codex:t.codex, datum:t.datum, plats:t.plats, nat:t.nat, kat:t.kat, kon:t.kon,
      namn:t.namn, penalty:t.penalty, beraknad:t.beraknad,
      r:t.resultat.map(d=>[d.pos, d.bib, d.fis, d.namn, d.nat, d.status, d.tid, d.poang])}));
    writeFileSync(join(UT, M, ARKIVFIL), JSON.stringify({uppdaterad:new Date().toISOString().slice(0,10), lopp:ut}));
    console.log(`${g.namn}: ${franArkiv} lopp från arkivet, ${ut.length} lopp i nya arkivet`);
  }

  for(const t of Object.values(lopp)) for(const d of t.resultat){
    const a = akare[d.fis];
    if(a) a.resultat.push({lopp:t, pos:d.pos, status:d.status, poang:d.poang});
  }
  Object.values(lopp).forEach(t=>t.resultat.sort((a,b)=>(a.pos||9999)-(b.pos||9999)));
  Object.values(akare).forEach(a=>a.resultat.sort((x,y)=>y.lopp.datum.localeCompare(x.lopp.datum)));

  const loppAdress = t => `${BAS}/races/${t.datum}-${slug(t.plats)}-${slug(t.namn)}-${t.codex}.html`;
  const akareAdress = a => `${BAS}/athletes/${a.fis}-${slug(namnSnyggt(a.efter,a.forn))}.html`;
  const klubbAdress = (nat,namn) => `${BAS}/clubs/${slug(nat)}-${slug(namn)}.html`;
  const klubbNyckel = (nat,namn) => nat+'|'+String(namn||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const brod = (...delar) => `<a href="/">Race Point</a> › <a href="${BAS}/">${esc(g.namn)}</a>`+
    delar.map(d=>' › '+d).join('');
  const sidaG = o => sida({...o, underrubrik:g.namn});
  const n2 = v => v!=null ? v.toFixed(2) : '–';

  /* ---- åkare ---- */
  const register = [], klubbar = {};
  let antalAkare = 0;
  for(const a of Object.values(akare)){
    const disc = KODER.filter(d=>a.poang[d]!=null);
    if(!disc.length) continue;
    const visa = namnSnyggt(a.efter,a.forn).trim();
    const adress = akareAdress(a);
    const kl = klubbLank(a.klubb, a.nat), klubbVisa = kl ? kl.namn : a.klubb;
    let inneh = `<h1>${flagga(a.nat)} ${esc(visa)}</h1>
<p class="ingress">FIS code ${esc(a.fis)} · ${esc(a.nat)}${a.fodd?' · born '+esc(a.fodd):''}${klubbVisa?' · '+esc(klubbVisa):''}</p>
<section class="kort"><h2>FIS points</h2><div class="tblwrap"><table>
<tr><th>Event</th><th class="n">Points</th><th class="n">World ranking</th></tr>`+
      disc.map(d=>`<tr><td>${DISC[d]}</td><td class="n">${n2(a.poang[d])}</td>`+
        `<td class="n muted">${a.rank[d]?'no. '+a.rank[d]:'–'}</td></tr>`).join('')+
      `</table></div><p class="not">${RIKTNING}. From ${esc(hdr.Listname)}, valid ${esc(hdr.Validfrom)} to ${esc(hdr.Validto)}.</p></section>`;
    if(a.resultat.length){
      inneh += `<section class="kort"><h2>Results</h2><div class="tblwrap"><table>
<tr><th>Date</th><th>Race</th><th class="n">Pos</th><th class="n">FIS points</th></tr>`+
        a.resultat.slice(0,40).map(r=>`<tr><td class="muted">${esc(r.lopp.datum)}</td>`+
          `<td><a href="${esc(loppAdress(r.lopp))}">${esc(r.lopp.plats)} · ${esc(r.lopp.namn)}</a></td>`+
          `<td class="n">${r.pos||esc(r.status||'')}</td><td class="n">${n2(r.poang)}</td></tr>`).join('')+
        `</table></div></section>`;
    }
    let klubbsida = '';
    if(klubbVisa){
      const k = klubbNyckel(a.nat, klubbVisa);
      const post = klubbar[k] || (klubbar[k] = {nat:a.nat, namn:klubbVisa, webb:kl&&kl.akta?kl.webb:'',
                                                 adress:klubbAdress(a.nat, klubbVisa), akare:[]});
      const basta = disc.slice().sort((x,y)=>battre(a.poang[x],a.poang[y]))[0];
      post.akare.push({visa, fodd:a.fodd, adress, poang:a.poang[basta], disc:basta});
      klubbsida = post.adress;
    }
    /* Åkarens egna länkar och sponsorer – samma formulär och samma godkännande
       som alpint (fis-profiler.js, nyckel = FIS-kod). */
    const egna = PROFIL[String(+a.fis)] || null;
    const sociala = (egna && egna.sociala) || [], sponsorer = (egna && egna.sponsorer) || [];
    if(kanalKnapp && (sociala.length || sponsorer.length)){
      inneh += IG_TONING+`<section class="kort"><h2>${esc(visa)}’s own links</h2>
<p class="not">The athlete's own channels — kept up to date by them, not by FIS.</p>`+
        (sociala.length ? `<div class="kanaler">`+sociala.map(x=>kanalKnapp(x.typ, x.adress, x.typ==='webb'?'Own website':'')).join('')+`</div>` : '')+
        (sponsorer.length ? `<h3 class="underrub">Sponsors</h3><div class="kanaler">`+
          sponsorer.map(x=>kanalKnapp('sponsor', x.adress, x.namn||sponsorNamn(x.adress))).join('')+`</div>` : '')+
        `</section>`;
    }
    const fb = forbundLank(a.nat);
    inneh += `<section class="kort"><h2>FIS and club</h2><div class="kanaler bred">`+
      offKnapp('bio', `https://www.fis-ski.com/DB/general/athlete-biography.html?sectorcode=${g.kod}&competitorid=${esc(a.id)}&type=result`, 'FIS biography')+
      offKnapp('forbund', fb.webb, fb.namn, fb.akta)+
      (kl ? offKnapp('klubb', kl.webb, kl.namn, kl.akta) : offTom('klubb','Club not listed by FIS'))+
      `</div>`+(klubbsida?`<div class="lankar"><a href="${esc(klubbsida)}">Everyone from ${esc(klubbVisa)}</a></div>`:'')+
      `</section>`;
    inneh += `<section class="kort dinsida"><h2>Is this you?</h2>
<p class="not">Add your social media and your sponsors to this page. It is free, it takes
a couple of minutes, and everything is checked before it appears.</p>
<div class="lankar"><a class="knapp" href="/alpine-skiing/lagg-till.html?fis=${esc(a.fis)}">Add your links</a>
<a class="knapp" href="/alpine-skiing/guide.html">Three ways to fund your season</a></div></section>`;
    skriv(adress, sidaG({
      titel:`${visa} – ${g.namn.toLowerCase()} FIS points and results | Race Point`,
      beskrivning:`${visa} (${a.nat}) ${g.namn.toLowerCase()} FIS points: `+
        disc.map(d=>`${DISC[d]} ${n2(a.poang[d])}`).join(', ')+'. World ranking and results.',
      adress, rot:'../../', brodsmula:brod(`<a href="${BAS}/athletes/">Athletes</a>`), innehall:inneh,
      jsonld:{'@context':'https://schema.org','@type':'Person', name:visa, nationality:a.nat, identifier:a.fis,
        sameAs:`https://www.fis-ski.com/DB/general/athlete-biography.html?sectorcode=${g.kod}&competitorid=${a.id}`}
    }));
    register.push({visa, nat:a.nat, adress, kon:a.kon, poang:a.poang, rank:a.rank});
    antalAkare++;
  }

  /* ---- klubbar ---- */
  const klubbLista = [];
  for(const k of Object.values(klubbar)){
    k.akare.sort((x,y)=>battre(x.poang,y.poang));
    const antal = k.akare.length;
    const inneh = `<h1>${flagga(k.nat)} ${esc(k.namn)}</h1>
<p class="ingress">${antal} athlete${antal===1?'':'s'} on the FIS ${esc(g.namn.toLowerCase())} points list${
  k.webb?' · <a href="'+esc(k.webb)+'" rel="noopener">club website</a>':''}</p>
<section class="kort"><h2>Athletes</h2><div class="tblwrap"><table>
<tr><th>Athlete</th><th class="n">Born</th><th class="n">Best points</th></tr>`+
      k.akare.map(a=>`<tr><td><a href="${esc(a.adress)}">${esc(a.visa)}</a></td>`+
        `<td class="n muted">${esc(a.fodd||'')}</td><td class="n">${n2(a.poang)} <span class="sm muted">${esc(DISC[a.disc])}</span></td></tr>`).join('')+
      `</table></div><p class="not">Something wrong in the list? <a href="/alpine-skiing/kontakt.html">Tell us</a> and we fix it the same day.</p></section>`+
      `<section class="kort dinsida"><h2>Is one of them you?</h2>
<p class="not">Every athlete above already has a page. Adding social media and sponsors takes a
couple of minutes and costs nothing. Everything is checked before it appears.</p>
<div class="lankar"><a class="knapp" href="/alpine-skiing/lagg-till.html">Add your links</a>
<a class="knapp" href="/alpine-skiing/guide.html">Three ways to fund your season</a></div></section>`;
    skriv(k.adress, sidaG({
      titel:`${k.namn} – ${g.namn.toLowerCase()} athletes and FIS points | Race Point`,
      beskrivning:`${k.namn}: ${antal} athlete${antal===1?'':'s'} on the FIS ${g.namn.toLowerCase()} points list, with points and results.`,
      adress:k.adress, rot:'../../', brodsmula:brod(`<a href="${BAS}/clubs/">Clubs</a>`, esc(k.namn)), innehall:inneh,
      jsonld:{'@context':'https://schema.org','@type':'SportsTeam', name:k.namn, sport:g.sport, ...(k.webb?{url:k.webb}:{})}
    }));
    klubbLista.push(k);
  }

  /* ---- lopp ---- */
  const loppLista = Object.values(lopp).filter(t=>t.resultat.length)
    .sort((a,b)=>b.datum.localeCompare(a.datum));
  for(const t of loppLista){
    const adress = loppAdress(t);
    const rubrik = `${t.namn} – ${t.plats}`;
    const inneh = `<h1>${flagga(t.nat)} ${esc(rubrik)}</h1>
<p class="ingress">${esc(t.datum)} · ${esc(t.kat)} · FIS codex ${esc(t.codex)}</p>
${t.penalty?`<section class="kort"><h2>Penalty</h2><div class="nums">
<div><div class="n">${esc(t.penalty)}</div><small>applied</small></div>
${t.beraknad?`<div><div class="n">${esc(t.beraknad)}</div><small>calculated</small></div>`:''}
<div><div class="n">${t.resultat.filter(r=>r.pos).length}</div><small>classified</small></div>
</div><p class="not">Each athlete's FIS points for this race are the race points plus the applied penalty.</p></section>`:''}
<section class="kort"><h2>Results</h2><div class="tblwrap"><table>
<tr><th class="n">Pos</th><th></th><th>Athlete</th><th class="n">${g.hogreBattre?'Result':'Time'}</th><th class="n">FIS points</th></tr>`+
      t.resultat.map(r=>{
        const a = akare[r.fis];
        const namn = a ? namnSnyggt(a.efter,a.forn) : r.namn;
        const lank = a && KODER.some(d=>a.poang[d]!=null) ? `<a href="${esc(akareAdress(a))}">${esc(namn)}</a>` : esc(namn);
        return `<tr><td class="n pos">${r.pos?`<span${r.pos<=3?` class="m${r.pos}"`:''}>${r.pos}</span>`:'<span class="muted">'+esc(r.status||'')+'</span>'}</td>`+
          `<td>${flagga(r.nat)}</td><td>${lank}</td><td class="n">${esc(r.tid)}</td><td class="n">${n2(r.poang)}</td></tr>`;
      }).join('')+`</table></div></section>`;
    skriv(adress, sidaG({
      titel:`${rubrik}, ${t.datum} – results | Race Point`,
      beskrivning:`${rubrik}, ${t.datum}. Full results and FIS points${t.penalty?`, applied penalty ${t.penalty}`:''}. FIS codex ${t.codex}.`,
      adress, rot:'../../', brodsmula:brod(`<a href="${BAS}/races/">Races</a>`), innehall:inneh,
      jsonld:{'@context':'https://schema.org','@type':'SportsEvent', name:rubrik, startDate:t.datum,
        sport:g.sport, location:{'@type':'Place', name:t.plats, address:t.nat}}
    }));
  }

  /* ---- förteckningar: åkare, klubbar, lopp ---- */
  const perNation = (lista, nyckel) => { const o={}; lista.forEach(x=>(o[x[nyckel]]=o[x[nyckel]]||[]).push(x)); return o; };
  const akPN = perNation(register,'nat');
  let inneh = `<h1>${esc(g.namn)} athletes</h1>
<p class="ingress">Every athlete on the current FIS ${esc(g.namn.toLowerCase())} points list, ${register.length} in total.</p>`;
  Object.keys(akPN).sort().forEach(nat=>{
    const l = akPN[nat].sort((a,b)=>a.visa.localeCompare(b.visa,'sv'));
    inneh += `<section class="kort"><h2>${flagga(nat)} ${esc(nat)} · ${l.length}</h2><div class="lankar">`+
      l.map(a=>`<a href="${esc(a.adress)}">${esc(a.visa)}</a>`).join('')+`</div></section>`;
  });
  skriv(`${BAS}/athletes/index.html`, sidaG({
    titel:`${g.namn} athletes – FIS points and results | Race Point`,
    beskrivning:`All ${register.length} athletes on the FIS ${g.namn.toLowerCase()} points list, with points, world ranking and results.`,
    adress:`${BAS}/athletes/`, rot:'../../', brodsmula:brod('Athletes'), innehall:inneh}));

  const klPN = perNation(klubbLista,'nat');
  inneh = `<h1>${esc(g.namn)} clubs</h1>
<p class="ingress">${klubbLista.length} clubs with athletes on the current FIS ${esc(g.namn.toLowerCase())} points list.</p>`;
  Object.keys(klPN).sort().forEach(nat=>{
    const l = klPN[nat].sort((a,b)=>a.namn.localeCompare(b.namn,'sv'));
    inneh += `<section class="kort"><h2>${flagga(nat)} ${esc(nat)} · ${l.length}</h2><div class="lankar">`+
      l.map(k=>`<a href="${esc(k.adress)}">${esc(k.namn)} <span class="sm">${k.akare.length}</span></a>`).join('')+`</div></section>`;
  });
  skriv(`${BAS}/clubs/index.html`, sidaG({
    titel:`${g.namn} clubs – athletes and FIS points | Race Point`,
    beskrivning:`All ${klubbLista.length} clubs with athletes on the FIS ${g.namn.toLowerCase()} points list.`,
    adress:`${BAS}/clubs/`, rot:'../../', brodsmula:brod('Clubs'), innehall:inneh}));

  inneh = `<h1>${esc(g.namn)} races</h1>
<p class="ingress">${loppLista.length} races that counted for FIS points, newest first.</p>`;
  const perManad = {};
  loppLista.forEach(t=>(perManad[t.datum.slice(0,7)]=perManad[t.datum.slice(0,7)]||[]).push(t));
  Object.keys(perManad).sort().reverse().forEach(m=>{
    inneh += `<section class="kort"><h2>${esc(m)} · ${perManad[m].length}</h2><div class="lankar">`+
      perManad[m].map(t=>`<a href="${esc(loppAdress(t))}">${flagga(t.nat)} ${esc(t.plats)} · ${esc(t.namn)} <span class="sm">${esc(t.datum.slice(5))}</span></a>`).join('')+
      `</div></section>`;
  });
  skriv(`${BAS}/races/index.html`, sidaG({
    titel:`${g.namn} races – results and FIS points | Race Point`,
    beskrivning:`${loppLista.length} FIS ${g.namn.toLowerCase()} races with full results, race points and applied penalty.`,
    adress:`${BAS}/races/`, rot:'../../', brodsmula:brod('Races'), innehall:inneh}));

  /* ---- översiktssidan: världsrankning per disciplin och kön ---- */
  inneh = `<h1>${esc(g.namn)} – FIS points and world ranking</h1>
<p class="ingress">Every athlete on the official FIS ${esc(g.namn.toLowerCase())} points list:
${register.length} athletes, ${klubbLista.length} clubs and ${loppLista.length} races.
From ${esc(hdr.Listname)}, valid ${esc(hdr.Validfrom)} to ${esc(hdr.Validto)}.</p>
<div class="lankar"><a class="knapp" href="${BAS}/athletes/">All athletes</a>
<a class="knapp" href="${BAS}/clubs/">All clubs</a><a class="knapp" href="${BAS}/races/">Races and results</a></div>`;
  for(const d of KODER) for(const [kon,konNamn] of [['M','Men'],['W','Women']]){
    const topp = register.filter(a=>a.kon===kon && a.rank[d]).sort((a,b)=>a.rank[d]-b.rank[d]).slice(0,25);
    if(!topp.length) continue;
    inneh += `<section class="kort"><h2>${esc(DISC[d])} · ${konNamn}</h2><div class="tblwrap"><table>
<tr><th class="n">Rank</th><th></th><th>Athlete</th><th class="n">FIS points</th></tr>`+
      topp.map(a=>`<tr><td class="n">${a.rank[d]}</td><td>${flagga(a.nat)}</td>`+
        `<td><a href="${esc(a.adress)}">${esc(a.visa)}</a></td><td class="n">${n2(a.poang[d])}</td></tr>`).join('')+
      `</table></div></section>`;
  }
  if(g.live) inneh += `<section class="kort"><h2>Live race points</h2><p class="not">Live penalty and new FIS
points during the race are coming for ${esc(g.namn.toLowerCase())}, the same way Race Point already
does it for <a href="/alpine-skiing/">alpine skiing</a>. Until then, every athlete's current points,
world ranking and results are here, updated every night from the official FIS list.</p></section>`;
  skriv(`${BAS}/index.html`, sidaG({
    titel:`${g.namn} FIS points and world ranking | Race Point`,
    beskrivning:`FIS ${g.namn.toLowerCase()} points for every athlete: world ranking in ${KODER.map(d=>DISC[d].toLowerCase()).join(' and ')}, clubs and race results, updated every night.`,
    adress:`${BAS}/`, rot:'../', brodsmula:`<a href="/">Race Point</a> › ${esc(g.namn)}`, innehall:inneh}));

  console.log(`${g.namn}: ${antalAkare} åkarsidor, ${klubbLista.length} klubbsidor, ${loppLista.length} loppsidor`);
  return {antalAkare, klubbar:klubbLista.length, lopp:loppLista.length};
}
