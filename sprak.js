/* Språk för Race Point.

   Så fungerar det: engelska är alltid utgångsläget, precis som på FIS egna
   sidor. Väljer besökaren ett annat språk i väljaren uppe till höger kommer
   valet ihåg till nästa besök. Saknas en översättning används engelska.

   Vill du lägga till ett språk: kopiera hela en:{...}-blocket, byt kod och
   översätt värdena. Nycklarna till vänster ska stå kvar oförändrade.
   {x} i en text byts ut mot ett värde när sidan ritas.                      */

window.SPRAK_ORDNING = ['en','sv','de','it','fr','es'];
window.SPRAK_NAMN = {en:'English', sv:'Svenska', de:'Deutsch', it:'Italiano',
                     fr:'Français', es:'Español'};
window.SPRAK_LOCALE = {en:'en-GB', sv:'sv-SE', de:'de-DE', it:'it-IT',
                       fr:'fr-FR', es:'es-ES'};

/* Rutan som föreslår att lägga sidan på hemskärmen. Android och Windows kan
   installera på riktigt med ett klick; iPhone har ingen sådan knapp, där får
   man visa var man trycker i stället. */
window.SPRAK_INSTALL = {
  en:{rubrik:'Add to your home screen', android:'Opens full screen, like an app. No app store, nothing to download.',
      ios:'Tap the share button below, then “Add to Home Screen”.',
      knapp:'Add', senare:'Not now'},
  sv:{rubrik:'Lägg till på hemskärmen', android:'Öppnas i helskärm, som en app. Ingen app-butik, inget att ladda ner.',
      ios:'Tryck på dela-knappen nedanför, välj sedan ”Lägg till på hemskärmen”.',
      knapp:'Lägg till', senare:'Inte nu'},
  de:{rubrik:'Zum Startbildschirm hinzufügen', android:'Öffnet im Vollbild, wie eine App. Kein App Store, kein Download.',
      ios:'Auf das Teilen-Symbol unten tippen, dann „Zum Home-Bildschirm“.',
      knapp:'Hinzufügen', senare:'Später'},
  it:{rubrik:'Aggiungi alla schermata Home', android:'Si apre a schermo intero, come un’app. Nessuno store, niente da scaricare.',
      ios:'Tocca il pulsante di condivisione in basso, poi “Aggiungi a Home”.',
      knapp:'Aggiungi', senare:'Non ora'},
  fr:{rubrik:"Ajouter à l'écran d'accueil", android:"S'ouvre en plein écran, comme une application. Aucun store, rien à télécharger.",
      ios:"Touchez le bouton Partager en bas, puis « Sur l'écran d'accueil ».",
      knapp:'Ajouter', senare:'Plus tard'},
  es:{rubrik:'Añadir a la pantalla de inicio', android:'Se abre a pantalla completa, como una app. Sin tienda, sin descargas.',
      ios:'Toca el botón de compartir abajo y elige “Añadir a inicio”.',
      knapp:'Añadir', senare:'Ahora no'}
};

/* Rubrik över sponsorerna. Medvetet utan varumärkesnamn. */
window.SPRAK_SPONSOR = {
  en:{rubrik:'Powered by'},   sv:{rubrik:'Drivs av'},
  de:{rubrik:'Ermöglicht von'}, it:{rubrik:'Con il sostegno di'},
  fr:{rubrik:'Avec le soutien de'}, es:{rubrik:'Con el apoyo de'}
};

/* Nyhetsrutan. Vi visar rubrik, källa och datum – texten står kvar hos den
   som skrivit den, och läsaren klickar vidare dit. */
window.SPRAK_NYHETER = {
  en:{rubrik:'Alpine news', fot:'Headlines from open feeds. Tap one to read it at the source.'},
  sv:{rubrik:'Alpina nyheter', fot:'Rubriker från öppna flöden. Klicka för att läsa hos källan.'},
  de:{rubrik:'Alpin-Nachrichten', fot:'Schlagzeilen aus offenen Feeds. Zum Lesen auf die Quelle tippen.'},
  it:{rubrik:'Notizie alpine', fot:'Titoli da feed aperti. Tocca per leggere sulla fonte.'},
  fr:{rubrik:'Actualités alpines', fot:'Titres issus de flux ouverts. Touchez pour lire à la source.'},
  es:{rubrik:'Noticias alpinas', fot:'Titulares de fuentes abiertas. Toca para leer en el origen.'}
};

/* Rubriker som delar tävlingslistan i två delar. */
window.SPRAK_AVDELARE = {
  en:{kommande:'Upcoming', tidigare:'Earlier races'},
  sv:{kommande:'Kommande', tidigare:'Tidigare tävlingar'},
  de:{kommande:'Bevorstehend', tidigare:'Frühere Wettkämpfe'},
  it:{kommande:'In programma', tidigare:'Gare precedenti'},
  fr:{kommande:'À venir', tidigare:'Courses précédentes'},
  es:{kommande:'Próximas', tidigare:'Carreras anteriores'}
};

/* Kolumnerna kring poängen, och förklaringen till att ett svagt lopp inte
   försämrar någons poäng. */
window.SPRAK_POANG = {
  en:{fisRace:'Race FIS points', harNu:'Current', battre:'Improvement',
      ingenForsamring:'A weaker race never makes an athlete worse. FIS averages the best results of the season, so only an improvement counts.'},
  sv:{fisRace:'FIS-poäng här', harNu:'Har nu', battre:'Förbättring',
      ingenForsamring:'Ett svagare lopp försämrar aldrig någons poäng. FIS räknar snittet av säsongens bästa resultat, så bara en förbättring räknas.'},
  de:{fisRace:'FIS-Punkte hier', harNu:'Aktuell', battre:'Verbesserung',
      ingenForsamring:'Ein schwächeres Rennen verschlechtert niemanden. FIS mittelt die besten Ergebnisse der Saison, es zählt also nur eine Verbesserung.'},
  it:{fisRace:'Punti FIS gara', harNu:'Attuali', battre:'Miglioramento',
      ingenForsamring:'Una gara più debole non peggiora mai nessuno. La FIS fa la media dei migliori risultati della stagione, quindi conta solo un miglioramento.'},
  fr:{fisRace:'Points FIS course', harNu:'Actuels', battre:'Amélioration',
      ingenForsamring:"Une course plus faible ne dégrade jamais un coureur. La FIS fait la moyenne des meilleurs résultats de la saison, seule une amélioration compte."},
  es:{fisRace:'Puntos FIS carrera', harNu:'Actuales', battre:'Mejora',
      ingenForsamring:'Una carrera más floja nunca empeora a nadie. La FIS promedia los mejores resultados de la temporada, así que solo cuenta una mejora.'}
};

/* Korta tidsenheter till nedräkningen: dygn, timmar, minuter, sekunder. */
window.SPRAK_ENHETER = {
  en:{d:'d', t:'h',   m:'min', s:'s'},
  sv:{d:'d', t:'tim', m:'min', s:'sek'},
  de:{d:'T', t:'Std', m:'Min', s:'Sek'},
  it:{d:'g', t:'h',   m:'min', s:'s'},
  fr:{d:'j', t:'h',   m:'min', s:'s'},
  es:{d:'d', t:'h',   m:'min', s:'s'}
};

window.SPRAK = {

en: {
  ingress:"Choose a race. While it runs, the penalty and the new FIS points are worked out after every finish.",
  alla:"All", herrar:"Men", damer:"Women", allaGrenar:"All events",
  ingaTraffar:"No races match the filter.",
  konM:"men", konW:"women", startKl:"start {t} local time",
  tillbaka:"‹ All races", tillbakaKort:"‹ Back", hamtar:"Loading …",
  idag:"Today", imorgon:"Tomorrow", igar:"Yesterday", live:"LIVE",
  medStodAv:"Supported by",

  tillStart:"until first start", paPlats:"on site", hosDig:"your time",
  pagar:"The race is under way", passerat:"The start time has passed",
  forstaStart:"First start {t} local time",

  penaltyNu:"Penalty right now", tillampad:"applied", beraknad:"calculated",
  iMal:"finished", kvar:"to come",
  last:"The penalty can no longer change.",
  lastForkl:"Nobody still to come has better FIS points than the five that count.",
  rorlig:"The penalty can still move — someone still to come has better FIS points than the fifth one counting now.",
  formel:"Sum A {a} plus sum B {b} minus sum C {c}, divided by ten, plus the category adder {d}. The minimum penalty for {k} is {m}.",
  svagtRubrik:"The penalty is not shown for this race.",
  svagtText:"The points file is missing {x} of {y} starters, which would make the calculation unreliable. Times and positions are still correct.",

  statistik:"Statistics", startande:"starters", fullfoljt:"finished",
  brutit:"did not finish", sekTill:"sec 1st to {n}th", tavlPoangSegrare:"race points, winner",

  resultatSaHarLangt:"Results so far", resultat:"Results",
  nr:"Bib", akare:"Athlete", tid:"Time", diff:"Diff", tavlP:"Race p.",
  nyaFis:"New FIS", nuKol:"Now", vinst:"Gain",
  resultatForkl:"Lower FIS points are better. Green means the athlete improves on this race. Tap a name for the athlete's page.",
  kvarAttAka:"Still to come ({n})", fisPoang:"FIS points", status:"Status", vantar:"waiting",

  vader:"Weather", vind:"Wind", byar:"Gusts", molnighet:"Cloud", luftfuktighet:"Humidity",
  nollgrans:"Freezing level", snodjup:"Snow depth", sikt:"Visibility",
  snoIdag:"Snow today", dygn:"Day", sol:"Sun", kannsSom:"feels like {t}°",
  over10:"over 10", km:"km",
  kurvaForkl:"The curve shows temperature hour by hour for the next day. Blue bars are snowfall, red figures at the top are gusts above 12 m/s. The measuring point is at {h} m — it is colder and windier higher up, and the freezing level tells you where the line runs. Weather from Open-Meteo.",
  ingenStation:"No weather station found for {p}.",

  sandning:"Broadcast and cameras",
  ingenSandning:"No broadcast or camera has been added for this race. FIS does not publish broadcast links in machine-readable form at this level, so organisers add them through the form.",
  sokSandning:"Search YouTube", sokKamera:"Search webcam",
  ejInbaddad:"Some broadcasters do not allow embedding — those open in a new tab.",

  fisPoangRubrik:"FIS points", gren:"Event", poang:"Points", placering:"World ranking",
  nrVarlden:"no. {n}", lankar:"Links", fisBio:"FIS biography", sponsorer:"Sponsors",
  ingaEgna:"This athlete has not added social media or sponsors yet. Athletes fill this in themselves, and nothing appears until a person has approved it.",
  laddar:"Loading the athlete's own links …",
  poangForkl:"Lower points are better. The ranking is the athlete's place on the FIS world list for that event.",

  ingenLive:"No live timing for codex {c}.",
  ingenLiveForkl:"Either the race has not opened yet, or FIS has removed the feed — it stays up for about a month afterwards.",
  ingenStartlista:"The feed has no start list yet.",
  okandGren:"Unknown event in the feed: {g}",
  uppdaterad:"updated {t}", oforandrad:"unchanged {t}",
  sprakval:"Language",
  foot:"Points list: {l} (valid {v}). Times and start lists from FIS live timing, points and rankings from the official FIS points list, weather from Open-Meteo. Broadcasts, cameras, social media and sponsors are added by organisers and athletes and shown after approval.",
  grenar:{DH:"Downhill", SL:"Slalom", GS:"Giant slalom", SG:"Super-G", AC:"Combined"}
},

sv: {
  ingress:"Välj tävling. Under tävlingen räknas penalty och nya FIS-poäng fram efter varje målgång.",
  alla:"Alla", herrar:"Herrar", damer:"Damer", allaGrenar:"Alla grenar",
  ingaTraffar:"Inga tävlingar matchar filtret.",
  konM:"herrar", konW:"damer", startKl:"start {t} lokal tid",
  tillbaka:"‹ Alla tävlingar", tillbakaKort:"‹ Tillbaka", hamtar:"Hämtar …",
  idag:"Idag", imorgon:"Imorgon", igar:"Igår", live:"LIVE",
  medStodAv:"Med stöd av",

  tillStart:"till första start", paPlats:"på plats", hosDig:"hos dig",
  pagar:"Tävlingen är igång", passerat:"Starten har passerat",
  forstaStart:"Första start {t} lokal tid",

  penaltyNu:"Penalty just nu", tillampad:"tillämpad", beraknad:"beräknad",
  iMal:"i mål", kvar:"kvar",
  last:"Penalty kan inte ändras mer.",
  lastForkl:"Ingen av dem som är kvar har bättre FIS-poäng än de fem som räknas.",
  rorlig:"Penalty kan fortfarande röra sig — någon som är kvar har bättre FIS-poäng än den femte som räknas nu.",
  formel:"Summa A {a} plus summa B {b} minus summa C {c}, delat med tio, plus kategoritillägg {d}. Minsta penalty för {k} är {m}.",
  svagtRubrik:"Penalty visas inte för den här tävlingen.",
  svagtText:"Poängunderlaget saknar {x} av {y} startande, och då blir uträkningen inte tillförlitlig. Tider och placeringar stämmer ändå.",

  statistik:"Statistik", startande:"startande", fullfoljt:"fullföljt",
  brutit:"brutit", sekTill:"sek 1:a till {n}:a", tavlPoangSegrare:"tävl.poäng segrare",

  resultatSaHarLangt:"Resultat så här långt", resultat:"Resultat",
  nr:"Nr", akare:"Åkare", tid:"Tid", diff:"Diff", tavlP:"Tävl.p",
  nyaFis:"Nya FIS", nuKol:"Nu", vinst:"Vinst",
  resultatForkl:"Lägre FIS-poäng är bättre. Grönt betyder att åkaren förbättrar sina poäng på den här tävlingen. Klicka på ett namn för åkarens sida.",
  kvarAttAka:"Kvar att åka ({n})", fisPoang:"FIS-poäng", status:"Status", vantar:"väntar",

  vader:"Väder", vind:"Vind", byar:"Byar", molnighet:"Molnighet", luftfuktighet:"Luftfuktighet",
  nollgrans:"Nollgradersnivå", snodjup:"Snödjup", sikt:"Sikt",
  snoIdag:"Snö i dag", dygn:"Dygn", sol:"Sol", kannsSom:"känns som {t}°",
  over10:"över 10", km:"km",
  kurvaForkl:"Kurvan visar temperaturen timme för timme det närmaste dygnet. Blå staplar är snöfall, röda siffror överst är vindbyar över 12 m/s. Mätpunkten ligger på {h} m ö.h. — uppe i backen är det kallare och blåsigare, och nollgradersnivån säger var gränsen går. Väderdata från Open-Meteo.",
  ingenStation:"Hittade ingen väderstation för {p}.",

  sandning:"Sändning och kameror",
  ingenSandning:"Ingen sändning eller kamera inlagd för den här tävlingen. FIS publicerar inte sändningslänkar maskinellt på den här nivån, så de fylls i av arrangören via formuläret.",
  sokSandning:"Sök sändning på YouTube", sokKamera:"Sök webbkamera",
  ejInbaddad:"Vissa sändningar tillåter inte att de visas inbäddade — de öppnas i en ny flik.",

  fisPoangRubrik:"FIS-poäng", gren:"Gren", poang:"Poäng", placering:"Placering i världen",
  nrVarlden:"nr {n}", lankar:"Länkar", fisBio:"FIS-biografi", sponsorer:"Sponsorer",
  ingaEgna:"Den här åkaren har inte lagt in sociala medier eller sponsorer än. Åkare fyller i sig själva, och inget syns här förrän en människa godkänt det.",
  laddar:"Laddar åkarens egna länkar …",
  poangForkl:"Lägre poäng är bättre. Placeringen är åkarens plats på FIS världslista i den grenen.",

  ingenLive:"Ingen livetiming för codex {c}.",
  ingenLiveForkl:"Antingen har tävlingen inte öppnats än, eller så har FIS tagit bort flödet — det ligger kvar ungefär en månad efteråt.",
  ingenStartlista:"Flödet innehåller ingen startlista ännu.",
  okandGren:"Okänd gren i flödet: {g}",
  uppdaterad:"uppdaterad {t}", oforandrad:"oförändrad {t}",
  sprakval:"Språk",
  foot:"Poängunderlag: {l} (giltig {v}). Tider och startlistor från FIS livetiming, poäng och placeringar från FIS officiella punktlista, väder från Open-Meteo. Sändningar, kameror, sociala medier och sponsorer läggs in av arrangörer och åkare och visas efter godkännande.",
  grenar:{DH:"Störtlopp", SL:"Slalom", GS:"Storslalom", SG:"Super-G", AC:"Kombination"}
},

de: {
  ingress:"Wettkampf wählen. Während des Rennens werden Penalty und neue FIS-Punkte nach jedem Zieleinlauf berechnet.",
  alla:"Alle", herrar:"Herren", damer:"Damen", allaGrenar:"Alle Disziplinen",
  ingaTraffar:"Keine Wettkämpfe entsprechen dem Filter.",
  konM:"Herren", konW:"Damen", startKl:"Start {t} Ortszeit",
  tillbaka:"‹ Alle Wettkämpfe", tillbakaKort:"‹ Zurück", hamtar:"Wird geladen …",
  idag:"Heute", imorgon:"Morgen", igar:"Gestern", live:"LIVE",
  medStodAv:"Unterstützt von",

  tillStart:"bis zum ersten Start", paPlats:"vor Ort", hosDig:"Ihre Zeit",
  pagar:"Das Rennen läuft", passerat:"Die Startzeit ist vorbei",
  forstaStart:"Erster Start {t} Ortszeit",

  penaltyNu:"Penalty aktuell", tillampad:"angewendet", beraknad:"berechnet",
  iMal:"im Ziel", kvar:"ausstehend",
  last:"Der Penalty kann sich nicht mehr ändern.",
  lastForkl:"Niemand von den Ausstehenden hat bessere FIS-Punkte als die fünf, die zählen.",
  rorlig:"Der Penalty kann sich noch ändern — jemand Ausstehendes hat bessere FIS-Punkte als der aktuell fünfte.",
  formel:"Summe A {a} plus Summe B {b} minus Summe C {c}, geteilt durch zehn, plus Kategoriezuschlag {d}. Der Mindest-Penalty für {k} beträgt {m}.",
  svagtRubrik:"Für dieses Rennen wird kein Penalty angezeigt.",
  svagtText:"In der Punkteliste fehlen {x} von {y} Startern, damit wäre die Berechnung nicht verlässlich. Zeiten und Platzierungen stimmen trotzdem.",

  statistik:"Statistik", startande:"Starter", fullfoljt:"im Ziel",
  brutit:"ausgeschieden", sekTill:"Sek. 1. bis {n}.", tavlPoangSegrare:"Rennpunkte Sieger",

  resultatSaHarLangt:"Zwischenstand", resultat:"Ergebnis",
  nr:"Nr.", akare:"Athlet", tid:"Zeit", diff:"Diff.", tavlP:"Rennp.",
  nyaFis:"Neue FIS", nuKol:"Aktuell", vinst:"Gewinn",
  resultatForkl:"Niedrigere FIS-Punkte sind besser. Grün heißt, der Athlet verbessert sich in diesem Rennen. Auf einen Namen tippen für die Athletenseite.",
  kvarAttAka:"Noch am Start ({n})", fisPoang:"FIS-Punkte", status:"Status", vantar:"wartet",

  vader:"Wetter", vind:"Wind", byar:"Böen", molnighet:"Bewölkung", luftfuktighet:"Luftfeuchte",
  nollgrans:"Nullgradgrenze", snodjup:"Schneehöhe", sikt:"Sicht",
  snoIdag:"Schnee heute", dygn:"Tag", sol:"Sonne", kannsSom:"gefühlt {t}°",
  over10:"über 10", km:"km",
  kurvaForkl:"Die Kurve zeigt die Temperatur Stunde für Stunde für den nächsten Tag. Blaue Balken sind Schneefall, rote Zahlen oben sind Böen über 12 m/s. Der Messpunkt liegt auf {h} m — weiter oben ist es kälter und windiger, und die Nullgradgrenze sagt, wo die Grenze verläuft. Wetterdaten von Open-Meteo.",
  ingenStation:"Keine Wetterstation für {p} gefunden.",

  sandning:"Übertragung und Kameras",
  ingenSandning:"Für dieses Rennen ist keine Übertragung und keine Kamera hinterlegt. FIS veröffentlicht auf dieser Ebene keine maschinenlesbaren Links, deshalb tragen die Veranstalter sie über das Formular ein.",
  sokSandning:"Auf YouTube suchen", sokKamera:"Webcam suchen",
  ejInbaddad:"Manche Sender erlauben keine Einbettung — diese öffnen in einem neuen Tab.",

  fisPoangRubrik:"FIS-Punkte", gren:"Disziplin", poang:"Punkte", placering:"Weltranglistenplatz",
  nrVarlden:"Nr. {n}", lankar:"Links", fisBio:"FIS-Biografie", sponsorer:"Sponsoren",
  ingaEgna:"Dieser Athlet hat noch keine sozialen Medien oder Sponsoren eingetragen. Athleten tragen sich selbst ein, und nichts erscheint hier, bevor ein Mensch es freigegeben hat.",
  laddar:"Eigene Links werden geladen …",
  poangForkl:"Niedrigere Punkte sind besser. Die Platzierung ist der Rang auf der FIS-Weltliste dieser Disziplin.",

  ingenLive:"Kein Live-Timing für Codex {c}.",
  ingenLiveForkl:"Entweder ist das Rennen noch nicht geöffnet, oder FIS hat den Feed entfernt — er bleibt etwa einen Monat lang bestehen.",
  ingenStartlista:"Der Feed enthält noch keine Startliste.",
  okandGren:"Unbekannte Disziplin im Feed: {g}",
  uppdaterad:"aktualisiert {t}", oforandrad:"unverändert {t}",
  sprakval:"Sprache",
  foot:"Punkteliste: {l} (gültig {v}). Zeiten und Startlisten von FIS Live-Timing, Punkte und Platzierungen aus der offiziellen FIS-Punkteliste, Wetter von Open-Meteo. Übertragungen, Kameras, soziale Medien und Sponsoren werden von Veranstaltern und Athleten eingetragen und nach Freigabe angezeigt.",
  grenar:{DH:"Abfahrt", SL:"Slalom", GS:"Riesenslalom", SG:"Super-G", AC:"Kombination"}
},

it: {
  ingress:"Scegli una gara. Durante la gara la penalità e i nuovi punti FIS vengono calcolati dopo ogni arrivo.",
  alla:"Tutte", herrar:"Uomini", damer:"Donne", allaGrenar:"Tutte le specialità",
  ingaTraffar:"Nessuna gara corrisponde al filtro.",
  konM:"uomini", konW:"donne", startKl:"partenza {t} ora locale",
  tillbaka:"‹ Tutte le gare", tillbakaKort:"‹ Indietro", hamtar:"Caricamento …",
  idag:"Oggi", imorgon:"Domani", igar:"Ieri", live:"LIVE",
  medStodAv:"Con il sostegno di",

  tillStart:"alla prima partenza", paPlats:"in loco", hosDig:"ora tua",
  pagar:"La gara è in corso", passerat:"L'ora di partenza è passata",
  forstaStart:"Prima partenza {t} ora locale",

  penaltyNu:"Penalità in questo momento", tillampad:"applicata", beraknad:"calcolata",
  iMal:"arrivati", kvar:"da partire",
  last:"La penalità non può più cambiare.",
  lastForkl:"Nessuno di quelli che devono ancora scendere ha punti FIS migliori dei cinque che contano.",
  rorlig:"La penalità può ancora cambiare — qualcuno che deve scendere ha punti FIS migliori del quinto che conta ora.",
  formel:"Somma A {a} più somma B {b} meno somma C {c}, diviso dieci, più il supplemento di categoria {d}. La penalità minima per {k} è {m}.",
  svagtRubrik:"Per questa gara la penalità non viene mostrata.",
  svagtText:"Mancano {x} atleti su {y} nell'elenco punti, e il calcolo non sarebbe attendibile. Tempi e piazzamenti restano corretti.",

  statistik:"Statistiche", startande:"partenti", fullfoljt:"arrivati",
  brutit:"ritirati", sekTill:"sec dal 1° al {n}°", tavlPoangSegrare:"punti gara vincitore",

  resultatSaHarLangt:"Risultati finora", resultat:"Risultati",
  nr:"Pett.", akare:"Atleta", tid:"Tempo", diff:"Dist.", tavlP:"Punti gara",
  nyaFis:"Nuovi FIS", nuKol:"Ora", vinst:"Guadagno",
  resultatForkl:"Punti FIS più bassi sono migliori. Il verde indica che l'atleta migliora in questa gara. Tocca un nome per la scheda dell'atleta.",
  kvarAttAka:"Ancora da partire ({n})", fisPoang:"Punti FIS", status:"Stato", vantar:"in attesa",

  vader:"Meteo", vind:"Vento", byar:"Raffiche", molnighet:"Nuvolosità", luftfuktighet:"Umidità",
  nollgrans:"Quota zero termico", snodjup:"Neve al suolo", sikt:"Visibilità",
  snoIdag:"Neve oggi", dygn:"Giornata", sol:"Sole", kannsSom:"percepiti {t}°",
  over10:"oltre 10", km:"km",
  kurvaForkl:"La curva mostra la temperatura ora per ora nelle prossime ventiquattr'ore. Le barre blu sono la neve, le cifre rosse in alto sono raffiche sopra 12 m/s. Il punto di misura è a {h} m — più in alto fa più freddo e c'è più vento, e lo zero termico dice dove passa il limite. Dati meteo da Open-Meteo.",
  ingenStation:"Nessuna stazione meteo trovata per {p}.",

  sandning:"Diretta e telecamere",
  ingenSandning:"Per questa gara non è stata inserita nessuna diretta né telecamera. A questo livello la FIS non pubblica i link in forma leggibile da un programma, quindi li inseriscono gli organizzatori tramite il modulo.",
  sokSandning:"Cerca su YouTube", sokKamera:"Cerca webcam",
  ejInbaddad:"Alcune emittenti non consentono l'incorporamento — quelle si aprono in una nuova scheda.",

  fisPoangRubrik:"Punti FIS", gren:"Specialità", poang:"Punti", placering:"Posizione mondiale",
  nrVarlden:"n. {n}", lankar:"Collegamenti", fisBio:"Scheda FIS", sponsorer:"Sponsor",
  ingaEgna:"Questo atleta non ha ancora inserito social o sponsor. Sono gli atleti stessi a compilare, e nulla appare prima che una persona lo abbia approvato.",
  laddar:"Caricamento dei collegamenti dell'atleta …",
  poangForkl:"Punti più bassi sono migliori. La posizione è quella dell'atleta nella lista mondiale FIS della specialità.",

  ingenLive:"Nessun cronometraggio in diretta per il codex {c}.",
  ingenLiveForkl:"O la gara non è ancora stata aperta, oppure la FIS ha rimosso il flusso — resta disponibile circa un mese.",
  ingenStartlista:"Il flusso non contiene ancora una lista di partenza.",
  okandGren:"Specialità sconosciuta nel flusso: {g}",
  uppdaterad:"aggiornato {t}", oforandrad:"invariato {t}",
  sprakval:"Lingua",
  foot:"Elenco punti: {l} (valido {v}). Tempi e liste di partenza dal cronometraggio FIS, punti e posizioni dall'elenco punti FIS ufficiale, meteo da Open-Meteo. Dirette, telecamere, social e sponsor sono inseriti da organizzatori e atleti e mostrati dopo approvazione.",
  grenar:{DH:"Discesa libera", SL:"Slalom", GS:"Slalom gigante", SG:"Super-G", AC:"Combinata"}
},

fr: {
  ingress:"Choisissez une course. Pendant la course, la pénalité et les nouveaux points FIS sont calculés après chaque arrivée.",
  alla:"Toutes", herrar:"Hommes", damer:"Femmes", allaGrenar:"Toutes les épreuves",
  ingaTraffar:"Aucune course ne correspond au filtre.",
  konM:"hommes", konW:"femmes", startKl:"départ {t} heure locale",
  tillbaka:"‹ Toutes les courses", tillbakaKort:"‹ Retour", hamtar:"Chargement …",
  idag:"Aujourd'hui", imorgon:"Demain", igar:"Hier", live:"DIRECT",
  medStodAv:"Avec le soutien de",

  tillStart:"avant le premier départ", paPlats:"sur place", hosDig:"votre heure",
  pagar:"La course est en cours", passerat:"L'heure de départ est passée",
  forstaStart:"Premier départ {t} heure locale",

  penaltyNu:"Pénalité actuelle", tillampad:"appliquée", beraknad:"calculée",
  iMal:"à l'arrivée", kvar:"à partir",
  last:"La pénalité ne peut plus changer.",
  lastForkl:"Aucun coureur restant n'a de meilleurs points FIS que les cinq retenus.",
  rorlig:"La pénalité peut encore bouger — un coureur restant a de meilleurs points FIS que le cinquième retenu.",
  formel:"Somme A {a} plus somme B {b} moins somme C {c}, divisé par dix, plus le supplément de catégorie {d}. La pénalité minimale pour {k} est {m}.",
  svagtRubrik:"La pénalité n'est pas affichée pour cette course.",
  svagtText:"Il manque {x} coureurs sur {y} dans la liste de points, le calcul ne serait pas fiable. Les temps et les places restent corrects.",

  statistik:"Statistiques", startande:"partants", fullfoljt:"à l'arrivée",
  brutit:"abandons", sekTill:"sec du 1er au {n}e", tavlPoangSegrare:"points course, vainqueur",

  resultatSaHarLangt:"Résultats provisoires", resultat:"Résultats",
  nr:"Dossard", akare:"Coureur", tid:"Temps", diff:"Écart", tavlP:"Pts course",
  nyaFis:"Nouveaux FIS", nuKol:"Actuel", vinst:"Gain",
  resultatForkl:"Des points FIS plus bas sont meilleurs. Le vert signifie que le coureur s'améliore sur cette course. Touchez un nom pour la fiche du coureur.",
  kvarAttAka:"Encore à partir ({n})", fisPoang:"Points FIS", status:"Statut", vantar:"en attente",

  vader:"Météo", vind:"Vent", byar:"Rafales", molnighet:"Nuages", luftfuktighet:"Humidité",
  nollgrans:"Isotherme zéro", snodjup:"Hauteur de neige", sikt:"Visibilité",
  snoIdag:"Neige aujourd'hui", dygn:"Journée", sol:"Soleil", kannsSom:"ressenti {t}°",
  over10:"plus de 10", km:"km",
  kurvaForkl:"La courbe montre la température heure par heure pour les prochaines vingt-quatre heures. Les barres bleues sont les chutes de neige, les chiffres rouges en haut sont les rafales au-dessus de 12 m/s. Le point de mesure est à {h} m — plus haut il fait plus froid et plus venteux, et l'isotherme zéro indique où passe la limite. Données météo d'Open-Meteo.",
  ingenStation:"Aucune station météo trouvée pour {p}.",

  sandning:"Diffusion et caméras",
  ingenSandning:"Aucune diffusion ni caméra n'a été ajoutée pour cette course. À ce niveau, la FIS ne publie pas de liens exploitables automatiquement, ce sont donc les organisateurs qui les ajoutent via le formulaire.",
  sokSandning:"Chercher sur YouTube", sokKamera:"Chercher une webcam",
  ejInbaddad:"Certains diffuseurs n'autorisent pas l'intégration — ceux-là s'ouvrent dans un nouvel onglet.",

  fisPoangRubrik:"Points FIS", gren:"Épreuve", poang:"Points", placering:"Classement mondial",
  nrVarlden:"n° {n}", lankar:"Liens", fisBio:"Biographie FIS", sponsorer:"Sponsors",
  ingaEgna:"Ce coureur n'a pas encore ajouté de réseaux sociaux ni de sponsors. Les coureurs remplissent eux-mêmes, et rien n'apparaît avant validation par une personne.",
  laddar:"Chargement des liens du coureur …",
  poangForkl:"Des points plus bas sont meilleurs. Le classement est la place du coureur sur la liste mondiale FIS de l'épreuve.",

  ingenLive:"Pas de chronométrage en direct pour le codex {c}.",
  ingenLiveForkl:"Soit la course n'est pas encore ouverte, soit la FIS a retiré le flux — il reste disponible environ un mois.",
  ingenStartlista:"Le flux ne contient pas encore de liste de départ.",
  okandGren:"Épreuve inconnue dans le flux : {g}",
  uppdaterad:"mis à jour {t}", oforandrad:"inchangé {t}",
  sprakval:"Langue",
  foot:"Liste de points : {l} (valable {v}). Temps et listes de départ du chronométrage FIS, points et classements de la liste de points officielle FIS, météo d'Open-Meteo. Diffusions, caméras, réseaux sociaux et sponsors sont ajoutés par les organisateurs et les coureurs et affichés après validation.",
  grenar:{DH:"Descente", SL:"Slalom", GS:"Slalom géant", SG:"Super-G", AC:"Combiné"}
},

es: {
  ingress:"Elige una carrera. Durante la carrera, la penalización y los nuevos puntos FIS se calculan tras cada llegada.",
  alla:"Todas", herrar:"Hombres", damer:"Mujeres", allaGrenar:"Todas las disciplinas",
  ingaTraffar:"Ninguna carrera coincide con el filtro.",
  konM:"hombres", konW:"mujeres", startKl:"salida {t} hora local",
  tillbaka:"‹ Todas las carreras", tillbakaKort:"‹ Volver", hamtar:"Cargando …",
  idag:"Hoy", imorgon:"Mañana", igar:"Ayer", live:"EN VIVO",
  medStodAv:"Con el apoyo de",

  tillStart:"para la primera salida", paPlats:"en pista", hosDig:"tu hora",
  pagar:"La carrera está en marcha", passerat:"La hora de salida ya pasó",
  forstaStart:"Primera salida {t} hora local",

  penaltyNu:"Penalización ahora mismo", tillampad:"aplicada", beraknad:"calculada",
  iMal:"en meta", kvar:"por salir",
  last:"La penalización ya no puede cambiar.",
  lastForkl:"Ninguno de los que faltan tiene mejores puntos FIS que los cinco que cuentan.",
  rorlig:"La penalización todavía puede moverse — alguien que falta tiene mejores puntos FIS que el quinto que cuenta ahora.",
  formel:"Suma A {a} más suma B {b} menos suma C {c}, dividido entre diez, más el suplemento de categoría {d}. La penalización mínima para {k} es {m}.",
  svagtRubrik:"La penalización no se muestra en esta carrera.",
  svagtText:"Faltan {x} de {y} corredores en la lista de puntos, y el cálculo no sería fiable. Los tiempos y las posiciones siguen siendo correctos.",

  statistik:"Estadísticas", startande:"salidas", fullfoljt:"llegadas",
  brutit:"abandonos", sekTill:"seg del 1º al {n}º", tavlPoangSegrare:"puntos de carrera, ganador",

  resultatSaHarLangt:"Resultados provisionales", resultat:"Resultados",
  nr:"Dorsal", akare:"Corredor", tid:"Tiempo", diff:"Dif.", tavlP:"Ptos carrera",
  nyaFis:"Nuevos FIS", nuKol:"Actual", vinst:"Ganancia",
  resultatForkl:"Menos puntos FIS es mejor. El verde indica que el corredor mejora en esta carrera. Toca un nombre para ver su ficha.",
  kvarAttAka:"Aún por salir ({n})", fisPoang:"Puntos FIS", status:"Estado", vantar:"esperando",

  vader:"Tiempo", vind:"Viento", byar:"Rachas", molnighet:"Nubosidad", luftfuktighet:"Humedad",
  nollgrans:"Cota de nieve", snodjup:"Espesor de nieve", sikt:"Visibilidad",
  snoIdag:"Nieve hoy", dygn:"Día", sol:"Sol", kannsSom:"sensación {t}°",
  over10:"más de 10", km:"km",
  kurvaForkl:"La curva muestra la temperatura hora a hora durante las próximas veinticuatro horas. Las barras azules son nevadas, las cifras rojas de arriba son rachas por encima de 12 m/s. El punto de medición está a {h} m — más arriba hace más frío y más viento, y la cota de nieve indica dónde está el límite. Datos meteorológicos de Open-Meteo.",
  ingenStation:"No se encontró estación meteorológica para {p}.",

  sandning:"Retransmisión y cámaras",
  ingenSandning:"No se ha añadido retransmisión ni cámara para esta carrera. A este nivel la FIS no publica enlaces legibles por un programa, así que los añaden los organizadores mediante el formulario.",
  sokSandning:"Buscar en YouTube", sokKamera:"Buscar webcam",
  ejInbaddad:"Algunas emisoras no permiten la incrustación — esas se abren en una pestaña nueva.",

  fisPoangRubrik:"Puntos FIS", gren:"Disciplina", poang:"Puntos", placering:"Posición mundial",
  nrVarlden:"nº {n}", lankar:"Enlaces", fisBio:"Ficha FIS", sponsorer:"Patrocinadores",
  ingaEgna:"Este corredor todavía no ha añadido redes sociales ni patrocinadores. Son los propios corredores quienes lo rellenan, y nada aparece hasta que una persona lo ha aprobado.",
  laddar:"Cargando los enlaces del corredor …",
  poangForkl:"Menos puntos es mejor. La posición es el puesto del corredor en la lista mundial FIS de esa disciplina.",

  ingenLive:"No hay cronometraje en directo para el codex {c}.",
  ingenLiveForkl:"O la carrera aún no se ha abierto, o la FIS ha retirado el flujo — se mantiene alrededor de un mes.",
  ingenStartlista:"El flujo todavía no contiene lista de salida.",
  okandGren:"Disciplina desconocida en el flujo: {g}",
  uppdaterad:"actualizado {t}", oforandrad:"sin cambios {t}",
  sprakval:"Idioma",
  foot:"Lista de puntos: {l} (válida {v}). Tiempos y listas de salida del cronometraje FIS, puntos y posiciones de la lista de puntos oficial FIS, meteorología de Open-Meteo. Retransmisiones, cámaras, redes sociales y patrocinadores los añaden organizadores y corredores y se muestran tras su aprobación.",
  grenar:{DH:"Descenso", SL:"Eslalon", GS:"Eslalon gigante", SG:"Súper-G", AC:"Combinada"}
}

};
