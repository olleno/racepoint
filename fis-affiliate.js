/* Rutan "Utrustning och resa" på åkarsidan.

   ── Så fungerar det ────────────────────────────────────────────────────────
   Åkaren delar sin egen profilsida, inte en reklamlänk. Länkarna i den här
   rutan bär hennes FIS-kod automatiskt, så när någon köper något via hennes
   sida vet partnern att det var hon som skickade dit köparen.

   Det behövs ingen server och ingen omdirigering. Nästan alla partnerprogram
   har ett fält för egen märkning som följer med köpet hela vägen till
   rapporten – Awin kallar det clickref, Booking kallar det label, Amazon
   kallar det ascsubtag. Vi lägger åkarens FIS-kod där. {FIS} nedan byts mot
   koden när sidan ritas.

   ── Två regler som inte får brytas ─────────────────────────────────────────
   1. UTRUSTNINGSMÄRKEN LIGGER INTE HÄR SOM STANDARD. En elitåkare har nästan
      alltid ett exklusivavtal om skidor. Ligger Salomon automatiskt på en
      Atomic-åkares sida kan hon bryta sitt eget avtal. Bara konfliktfria
      kategorier är på som standard: resa, boende, försäkring, eSIM, bank.
      Skidmärken får åkaren lägga till själv, aktivt.
   2. DET SKA STÅ ATT DET ÄR REKLAM. Marknadsföringslagen kräver att reklam
      går att känna igen, och både Booking och Amazon kräver det i sina egna
      villkor – bryter man mot det stängs kontot. Texten står i sprak.js under
      SPRAK_AFFILIATE och visas alltid ovanför rutan.

   ── Så lägger du till en partner ───────────────────────────────────────────
   Gå med i programmet, hämta din länk, och klistra in den nedan med {FIS}
   där din egen märkning ska stå. Sätt aktiv: true. Rutan visas bara om minst
   en partner är aktiv – tomma rutor är sämre än ingen ruta alls.          */

window.FIS_AFFILIATE = [

  /* ── Resa och boende ─────────────────────────────────────────────────── */
  {namn:'Booking.com', kategori:'resa', aktiv:false,
   text:'Boende vid tävlingsorten',
   adress:'https://www.booking.com/index.html?aid=DITT-AID&label=rp-{FIS}'},

  {namn:'SafetyWing', kategori:'resa', aktiv:false,
   text:'Reseförsäkring som täcker tävling utomlands',
   adress:'https://safetywing.com/?referenceID=DITT-ID&subid=rp-{FIS}'},

  {namn:'Airalo', kategori:'resa', aktiv:false,
   text:'eSIM – slipp roamingräkningen i sex tävlingsländer',
   adress:'https://www.airalo.com/?utm_source=DITT-ID&utm_content=rp-{FIS}'},

  /* ── Bank och betalning ──────────────────────────────────────────────── */
  {namn:'Revolut', kategori:'bank', aktiv:false,
   text:'Kort och valutaväxling för läger och tävlingsresor',
   adress:'https://www.revolut.com/?referrer=DITT-ID&sub=rp-{FIS}'},

  /* ── Utrustning: LIGGER AVSIKTLIGT AV ────────────────────────────────────
     Läs regel 1 ovan innan du sätter någon av dessa till true. De ska bara
     kunna komma upp på en åkares sida om hon själv har valt dem.          */
  {namn:'Salomon', kategori:'utrustning', aktiv:false, baraEgetVal:true,
   text:'Skidor, pjäxor och kläder',
   adress:'https://www.salomon.com/?utm_source=DITT-ID&utm_content=rp-{FIS}'},

  {namn:'POC', kategori:'utrustning', aktiv:false, baraEgetVal:true,
   text:'Hjälm och skydd',
   adress:'https://www.pocsports.com/?utm_source=DITT-ID&utm_content=rp-{FIS}'}
];

/* Kategorier som får visas utan att åkaren valt dem själv. */
window.FIS_AFFILIATE_FRIA = ['resa','bank','forsakring'];
