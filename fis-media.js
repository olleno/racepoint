/* Sändningar och webbkameror per tävling.

   ── Varför den här filen behövs ───────────────────────────────────────────
   Jag letade igenom FIS kalender, deras livetiming-sida och punktlistornas
   tävlingsfiler. FIS publicerar ingen sändningslänk i maskinläsbar form för
   FIS-nivåns tävlingar – av 18 arrangörer i höstens sydamerikanska serie hade
   två fyllt i sociala medier och ingen hade fyllt i sändning. Det finns alltså
   inget att hämta automatiskt. Länken måste komma från en människa.

   ── Så gör du det utan kostnad ────────────────────────────────────────────
   Samma sätt som åkarnas länkar: ett Google-formulär som arrangören fyller i,
   svaren till ett kalkylark, du sätter ja i en godkänn-kolumn, och sidan läser
   arket direkt. Skriv arkets adress i FIS_MEDIA_ARK nedan.

   Kolumner i arket:
     Codex      tävlingens codex, t.ex. 0301
     Typ        sandning, webbkamera eller webb
     Namn       visas som rubrik, t.ex. "Målområdet" eller "Arrangörens stream"
     Adress     hela adressen
     Godkänd    ja

   ── Vad sidan gör med adressen ────────────────────────────────────────────
   YouTube, Vimeo och Twitch bäddas in som spelare direkt på tävlingssidan.
   En adress som slutar på .jpg eller .png behandlas som en webbkamera-bild och
   laddas om var 30:e sekund – så fungerar de flesta liftbolagens kameror.
   Allt annat blir en tydlig knapp som öppnar sändningen i ny flik, eftersom
   många tv-sajter vägrar att visas inbäddade.                                */

window.FIS_MEDIA_ARK = "";   // t.ex.
// "https://docs.google.com/spreadsheets/d/DITT-ARK-ID/gviz/tq?tqx=out:csv&sheet=Media"

/* Här kan du lägga in tävlingar för hand. Exemplen är bortkommenterade –
   ta bort dem och lägg in riktiga när du har dem. */
window.FIS_MEDIA = {
  // "0301": [
  //   {typ: "sandning",   namn: "Arrangörens stream", adress: "https://www.youtube.com/watch?v=XXXXXXXXXXX"},
  //   {typ: "webbkamera", namn: "Toppen",             adress: "https://exempel.se/cam/topp.jpg"},
  //   {typ: "webb",       namn: "Chapelco",           adress: "https://chapelco.com"}
  // ]
};

/* ── Sponsorer på startsidan ───────────────────────────────────────────────
   Visas som en diskret rad längst ner, inte som reklam mitt i resultaten.
   "bild" är valfri – utan den visas bara namnet, vilket ofta ser bättre ut
   och laddar snabbare. Lägg loggor som .svg eller .png i samma mapp.        */
/* bild = logotyp i vit version, hämtad direkt från sponsorns egen sajt.
   Laddar den inte (sponsorn byter adress, blockerar länkning) visas namnet
   i text i stället – exakt som förut. Inget går sönder.
   Saknas bild helt ritas namnet som ordmärke. */
window.SIDSPONSORER = [
  {namn: "Added Vitamins",     adress: "https://addedvitamins.com",
   bild: "https://cdn.shopify.com/oxygen-v2/36622/27650/57626/2716968/assets/logo-white-BUQcMbY3.svg",
   hojd: 22},
  {namn: "Polaris Compliance", adress: "https://www.polariscompliance.eu/",
   bild: "https://www.polariscompliance.eu/assets/polaris-text-white.png",
   marke: "https://www.polariscompliance.eu/assets/star-green.png",
   hojd: 17},
  {namn: "Kommunradar",        adress: "https://kommunradar.se/"}
];
