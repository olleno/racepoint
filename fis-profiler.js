/* Åkarnas egna länkar: sociala medier och sponsorer.

   ── Så här fyller åkarna i sig själva, gratis ──────────────────────────────
   1. Gör ett Google-formulär med fälten: FIS-kod, Typ, Namn, Adress.
   2. Svaren hamnar automatiskt i ett Google-kalkylark.
   3. Lägg till en kolumn "Godkänd" i arket. Du skriver ja där när du tittat
      på länken. Inget syns på sidan innan dess.
   4. Dela arket som "alla med länken kan läsa".
   5. Skriv in arkets adress i FIS_PROFIL_ARK nedan.

   Sidan läser då arket direkt varje gång någon öppnar en åkare. Ingen server,
   ingen kostnad, och en ny åkare syns inom ett par sekunder efter att du
   godkänt raden. Sidan visar bara länkar till kända sajter (Instagram, TikTok,
   YouTube, Facebook, X, Strava, Linkedin) plus åkarens egen och sponsorernas
   webbadresser – allt annat ignoreras.

   Kolumner i arket:
     FIS-kod   åkarens FIS-nummer, t.ex. 203114
     Typ       instagram, tiktok, youtube, facebook, x, strava, linkedin,
               webb eller sponsor
     Namn      visas som text, t.ex. sponsorns namn. Får vara tomt.
     Adress    hela adressen, t.ex. https://www.instagram.com/namn
     Godkänd   ja
   ─────────────────────────────────────────────────────────────────────── */

window.FIS_PROFIL_ARK =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwUT7ciIAIZ9vdXFiDkQcPoLHAywC1PVetS8HNm7xcUPlBT0mIoCyAX4Ub7bEQb62nNPkiL1WTjjkb/pub?gid=0&single=true&output=csv";

/* Tills arket finns kan du lägga in åkare för hand här.
   Exemplen nedan är påhittade och finns bara för att visa formen –
   ta bort dem innan sidan används på riktigt. */
window.FIS_PROFILER = {
  // "203114": [
  //   {typ: "instagram", namn: "",          adress: "https://www.instagram.com/exempel"},
  //   {typ: "webb",      namn: "",          adress: "https://exempel.se"},
  //   {typ: "sponsor",   namn: "Atomic",    adress: "https://www.atomic.com"},
  //   {typ: "sponsor",   namn: "Lokalbanken", adress: "https://exempel-bank.se"}
  // ]
};
