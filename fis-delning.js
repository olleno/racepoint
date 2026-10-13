/* Delningskort för Race Point.

   Ritar ett kvadratiskt kort (1080×1080) i besökarens egen webbläsare och
   lämnar det vidare till mobilens delningsfönster, eller som nedladdning på
   en dator. Sajten behöver därför inte förgenerera en bild per åkare varje
   natt — 9 000 bilder som ändå nästan aldrig hämtas.

   Knappen i sidan bär all data den behöver i data-attribut, så den här filen
   läser ingenting annat och fungerar även om övriga skript inte laddats.

   Åkarkort:  data-kort="akare"
     data-namn data-klubb data-nat data-gren data-poang
     data-forra  (poängen på förra punktlistan, valfri)
     data-rank   (placering i världen, valfri)
     data-lista  (punktlistans namn)

   Klubbkort: data-kort="klubb"
     data-namn data-nat data-antal data-klara data-lista
     data-rader  (JSON: [{namn, gren, nu, forra}], valfri)
*/
(function () {
  'use strict';

  var MARIN = '#0B1C33';
  var ORANGE = '#FF4F2B';
  var VIT = '#FFFFFF';
  var DIS = '#9FB6D1';     // dämpad text
  var DIS2 = '#728FB0';    // ännu dämpad
  var LJUS = '#C8D6E8';
  var STOR = 1080;

  var SVART = '"Archivo Black", "Arial Black", "Helvetica Neue", sans-serif';
  var TEXT = 'Archivo, "Helvetica Neue", sans-serif';

  /* Typsnitten hämtas först när någon faktiskt trycker på dela, och bara en
     gång. Kommer de inte fram inom ett par sekunder ritas kortet ändå med
     systemets egna feta snitt — ett kort som dröjer är sämre än ett kort som
     är någon hårsmån mindre snyggt. */
  var typsnittLovat = null;
  function typsnitt() {
    if (typsnittLovat) return typsnittLovat;
    typsnittLovat = new Promise(function (klar) {
      try {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=Archivo+Black&display=swap';
        document.head.appendChild(l);
      } catch (e) { /* strunt samma, vi ritar ändå */ }

      var klarAnropad = false;
      var ge = function () { if (!klarAnropad) { klarAnropad = true; klar(); } };
      setTimeout(ge, 2500);

      if (document.fonts && document.fonts.load) {
        Promise.all([
          document.fonts.load('700 100px "Archivo Black"'),
          document.fonts.load('700 100px Archivo'),
          document.fonts.load('400 100px Archivo')
        ]).then(ge, ge);
      } else {
        setTimeout(ge, 600);
      }
    });
    return typsnittLovat;
  }

  function tal(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : null;
  }

  /* Krymper texten tills den får plats. Namn varierar från "Li Na" till
     "Abderrahmane Nacer Ellah Bouderbala", och ett kort där namnet rinner ut
     över kanten är värre än ett kort med lite mindre namn. */
  function skrivKrympt(k, text, x, y, vikt, familj, start, minsta, bredd) {
    var s = start, t = String(text == null ? '' : text);
    var fore = vikt ? vikt + ' ' : '';
    for (;;) {
      k.font = fore + s + 'px ' + familj;
      if (k.measureText(t).width <= bredd) break;
      if (s > minsta) { s -= 2; continue; }
      /* Nedre gransen nadd. Da kortas namnet av i stallet for att krympa
         vidare - "Edmondo Maurizio Duperty Villafranca Boscone" blev annars
         en rad grastecken ingen kunde lasa. */
      while (t.length > 1 && k.measureText(t + '…').width > bredd) t = t.slice(0, -1);
      t = t.replace(/\s+$/, '') + '…';
      break;
    }
    k.fillText(t, x, y);
    return s;
  }

  /* Den snedställda stapeln plus ordmärket, uppe till vänster. */
  function sigill(k) {
    k.save();
    k.fillStyle = ORANGE;
    k.beginPath();
    k.moveTo(68, 58); k.lineTo(96, 58); k.lineTo(86, 104); k.lineTo(58, 104);
    k.closePath(); k.fill();
    k.restore();
    k.fillStyle = VIT;
    k.font = '30px ' + SVART;
    k.textBaseline = 'alphabetic';
    var t = 'RACE POINT';
    var x = 112;
    for (var i = 0; i < t.length; i++) {       // luftad spärrning för hand
      k.fillText(t[i], x, 94);
      x += k.measureText(t[i]).width + 3.4;
    }
  }

  function fot(k, vanster) {
    k.fillStyle = DIS2;
    k.font = '600 24px ' + TEXT;
    k.fillText(vanster, 64, 1014);
    k.fillStyle = ORANGE;
    k.font = '700 26px ' + TEXT;
    k.textAlign = 'right';
    k.fillText('racepoint.net', STOR - 64, 1014);
    k.textAlign = 'left';
  }

  function overstruken(k, text, x, y, snitt, farg) {
    k.fillStyle = farg;
    k.font = snitt;
    k.fillText(text, x, y);
    var b = k.measureText(text).width;
    k.fillRect(x, y - 16, b, 4);
    return b;
  }

  /* ---------- åkarkortet ---------- */
  function ritaAkare(k, d) {
    var nu = tal(d.poang);
    var forra = tal(d.forra);
    var sankning = (forra != null && nu != null && forra - nu > 0.004) ? forra - nu : null;

    k.fillStyle = MARIN;
    k.fillRect(0, 0, STOR, STOR);
    sigill(k);

    k.textAlign = 'right';
    k.fillStyle = DIS;
    k.font = '600 20px ' + TEXT;
    k.fillText((d.lista || '').toUpperCase(), STOR - 64, 94);
    k.textAlign = 'left';

    if (sankning != null) {
      k.fillStyle = ORANGE;
      k.font = '34px ' + SVART;
      k.fillText('POINTS DROPPED', 64, 330);

      /* Grennamnet pa egen rad under talet. Bredvid talet gick "Giant Slalom"
         utanfor kanten sa fort poangen var trestallig. */
      k.fillStyle = VIT;
      skrivKrympt(k, '−' + sankning.toFixed(2), 64, 520, '', SVART, 220, 110, STOR - 128);

      k.fillStyle = LJUS;
      skrivKrympt(k, String(d.gren || '').toUpperCase(), 64, 580, '', SVART, 46, 24, STOR - 128);

      var b = overstruken(k, forra.toFixed(2), 64, 668, '700 50px ' + TEXT, DIS2);

      k.strokeStyle = DIS;
      k.lineWidth = 4;
      k.beginPath();
      k.moveTo(64 + b + 28, 650); k.lineTo(64 + b + 102, 650);
      k.moveTo(64 + b + 88, 638); k.lineTo(64 + b + 104, 650);
      k.lineTo(64 + b + 88, 662);
      k.stroke();

      k.fillStyle = VIT;
      k.font = '700 74px ' + TEXT;
      k.fillText(nu.toFixed(2), 64 + b + 132, 672);
    } else {
      k.fillStyle = ORANGE;
      k.font = '34px ' + SVART;
      k.fillText('FIS POINTS', 64, 330);

      k.fillStyle = VIT;
      skrivKrympt(k, nu != null ? nu.toFixed(2) : '–', 64, 530, '', SVART, 230, 110, STOR - 128);

      k.fillStyle = LJUS;
      skrivKrympt(k, String(d.gren || '').toUpperCase(), 64, 590, '', SVART, 46, 24, STOR - 128);

      if (d.rank) {
        k.fillStyle = DIS;
        k.font = '600 42px ' + TEXT;
        k.fillText('No. ' + d.rank + ' in the world', 64, 668);
      }
    }

    /* Raden som gör kortet till någons, inte till en siffra. */
    k.fillStyle = 'rgba(255,255,255,0.14)';
    k.fillRect(64, 800, STOR - 128, 3);

    k.fillStyle = VIT;
    skrivKrympt(k, d.namn || '', 64, 888, '', SVART, 56, 26, STOR - 128);

    var under = [d.klubb, d.nat].filter(Boolean).join(' · ');
    if (under) {
      k.fillStyle = DIS;
      skrivKrympt(k, under, 64, 936, '600', TEXT, 30, 22, STOR - 128);
    }

    fot(k, 'CALCULATED IN THE FINISH AREA');
  }

  /* ---------- klubbkortet ---------- */
  function ritaKlubb(k, d) {
    k.fillStyle = MARIN;
    k.fillRect(0, 0, STOR, STOR);
    sigill(k);

    k.textAlign = 'right';
    k.fillStyle = DIS;
    k.font = '600 20px ' + TEXT;
    k.fillText('CLUB', STOR - 64, 94);
    k.textAlign = 'left';

    k.fillStyle = VIT;
    skrivKrympt(k, d.namn || '', 64, 230, '', SVART, 66, 30, STOR - 128);

    k.fillStyle = DIS;
    k.font = '600 26px ' + TEXT;
    k.fillText((d.lista || '').toUpperCase(), 64, 274);

    /* Två tal: hur många som har fyllt i, och hur många som inte har det.
       Det andra talet är det som får en tränare att skicka vidare länken. */
    var rutor = [
      [String(d.klara || 0), 'pages filled in'],
      [String(Math.max(0, (d.antal || 0) - (d.klara || 0))), 'still empty']
    ];
    rutor.forEach(function (r, i) {
      var x = 64 + i * 486;
      k.fillStyle = 'rgba(255,255,255,0.07)';
      k.fillRect(x, 316, 466, 150);
      k.fillStyle = ORANGE;
      k.font = '72px ' + SVART;
      k.fillText(r[0], x + 28, 404);
      k.fillStyle = LJUS;
      k.font = '600 24px ' + TEXT;
      k.fillText(r[1], x + 28, 442);
    });

    var rader = [];
    try { rader = JSON.parse(d.rader || '[]'); } catch (e) { rader = []; }

    var y = 540;
    rader.slice(0, 5).forEach(function (r, i) {
      var nu = tal(r.nu), forra = tal(r.forra);
      var sank = (forra != null && nu != null && forra - nu > 0.004) ? forra - nu : null;

      k.fillStyle = DIS2;
      k.font = '26px ' + SVART;
      k.fillText(('0' + (i + 1)).slice(-2), 64, y + 34);

      k.fillStyle = VIT;
      skrivKrympt(k, r.namn || '', 128, y + 34, '600', TEXT, 32, 26, 470);

      k.fillStyle = DIS;
      k.font = '600 24px ' + TEXT;
      k.fillText(String(r.gren || '').toUpperCase(), 624, y + 34);

      k.textAlign = 'right';
      k.fillStyle = VIT;
      k.font = '700 32px ' + TEXT;
      k.fillText(nu != null ? nu.toFixed(2) : '–', 870, y + 34);

      k.fillStyle = sank != null ? ORANGE : DIS2;
      k.font = '700 30px ' + TEXT;
      k.fillText(sank != null ? '−' + sank.toFixed(2) : '–', STOR - 64, y + 34);
      k.textAlign = 'left';

      k.fillStyle = 'rgba(255,255,255,0.10)';
      k.fillRect(64, y + 56, STOR - 128, 2);
      y += 78;
    });

    fot(k, 'EVERY STARTER COUNTED, NOT JUST THE PODIUM');
  }

  /* ---------- ruta, delning, nedladdning ---------- */
  function visa(duk, filnamn, text) {
    duk.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);

      var bak = document.createElement('div');
      bak.className = 'delaruta';
      bak.setAttribute('role', 'dialog');
      bak.setAttribute('aria-modal', 'true');
      bak.setAttribute('aria-label', 'Share card');

      var box = document.createElement('div');
      box.className = 'delalada';

      var bild = document.createElement('img');
      bild.src = url;
      bild.alt = text;
      box.appendChild(bild);

      var rad = document.createElement('div');
      rad.className = 'delaknappar';

      var fil = null;
      try { fil = new File([blob], filnamn, { type: 'image/png' }); } catch (e) { fil = null; }

      if (fil && navigator.canShare && navigator.canShare({ files: [fil] })) {
        var dela = document.createElement('button');
        dela.type = 'button';
        dela.className = 'knapp';
        dela.textContent = 'Share';
        dela.addEventListener('click', function () {
          navigator.share({ files: [fil], text: text }).catch(function () { /* avbrutet */ });
        });
        rad.appendChild(dela);
      }

      var hamta = document.createElement('a');
      hamta.className = 'knapp';
      hamta.href = url;
      hamta.download = filnamn;
      hamta.textContent = 'Download image';
      rad.appendChild(hamta);

      var stang = document.createElement('button');
      stang.type = 'button';
      stang.className = 'knapp sekundar';
      stang.textContent = 'Close';
      rad.appendChild(stang);

      box.appendChild(rad);
      bak.appendChild(box);
      document.body.appendChild(bak);

      function bort() {
        if (bak.parentNode) bak.parentNode.removeChild(bak);
        URL.revokeObjectURL(url);
        document.removeEventListener('keydown', tangent);
      }
      function tangent(e) { if (e.key === 'Escape') bort(); }
      stang.addEventListener('click', bort);
      bak.addEventListener('click', function (e) { if (e.target === bak) bort(); });
      document.addEventListener('keydown', tangent);
      stang.focus();
    }, 'image/png');
  }

  function gor(knapp) {
    var d = knapp.dataset;
    var innan = knapp.textContent;
    knapp.textContent = 'Making your card…';
    knapp.disabled = true;

    typsnitt().then(function () {
      var duk = document.createElement('canvas');
      duk.width = STOR; duk.height = STOR;
      var k = duk.getContext('2d');
      k.textBaseline = 'alphabetic';

      if (d.kort === 'klubb') ritaKlubb(k, d); else ritaAkare(k, d);

      var namn = String(d.namn || 'race-point').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'race-point';
      visa(duk, 'racepoint-' + namn + '.png',
        (d.namn || '') + ' — FIS points, racepoint.net');

      knapp.textContent = innan;
      knapp.disabled = false;
    });
  }

  function koppla() {
    var knappar = document.querySelectorAll('[data-kort]');
    for (var i = 0; i < knappar.length; i++) {
      (function (b) {
        if (b.dataset.kopplad) return;
        b.dataset.kopplad = '1';
        b.addEventListener('click', function () { gor(b); });
      })(knappar[i]);
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', koppla);
  else koppla();
})();
