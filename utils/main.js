// ============================================================
// HOCHZEITSWEBSITE DIANA & JULIAN – main.js
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ----------------------------------------------------------
  // FLUGZEUG ANIMATION – fliegt periodisch über die Seite und
  // pufft weiße Herz-Wolken aus
  // ----------------------------------------------------------
  (function initFlugzeugAnimation() {
    const wrapper  = document.getElementById('flug-plane-wrapper');
    const overlay  = document.getElementById('flug-overlay');
    if (!wrapper || !overlay) return;

    // Zufällige Höhe zwischen 10 vh und 55 vh
    function randomTop() {
      return Math.floor(Math.random() * 46 + 10) + 'vh';
    }

    // Herzchen-Positionen innerhalb der Wolke (wie eine Cumulus-Wolke)
    const herzPositionen = [
      { left: '18px', top: '18px', size: '1.8em' },
      { left: '34px', top: '6px',  size: '1.4em' },
      { left: '4px',  top: '8px',  size: '1.3em' },
      { left: '46px', top: '20px', size: '1.1em' },
      { left: '24px', top: '32px', size: '1.0em' },
    ];

    // Herz-Wolken-Cluster an aktueller Flugzeug-Heckposition erzeugen
    // nurImHero=true: nur spawnen wenn Flugzeug über dem Hero-Bereich ist
    function spawnHerzWolke(nurImHero) {
      if (nurImHero) {
        const heroEl = document.getElementById('start');
        const planeRect = wrapper.getBoundingClientRect();
        if (heroEl) {
          const heroRect = heroEl.getBoundingClientRect();
          // Flugzeug muss sich horizontal im Hero-Bereich befinden
          const planeMid = planeRect.left + planeRect.width / 2;
          if (planeMid < heroRect.left || planeMid > heroRect.right) return;
        }
      }

      const rect = wrapper.getBoundingClientRect();
      // Heck des Flugzeugs: linke Seite + kleiner Versatz
      const x = rect.left + 20;
      const y = rect.top + rect.height / 2 - 30;

      const wolke = document.createElement('div');
      wolke.classList.add('flug-herzwolke');
      wolke.style.left = x + 'px';
      wolke.style.top  = y + 'px';

      // Kleine zufällige Gesamtverschiebung pro Wolke
      const offsetX = (Math.random() * 20 - 10).toFixed(1) + 'px';
      const offsetY = (Math.random() * 16 - 8).toFixed(1) + 'px';
      wolke.style.marginLeft = offsetX;
      wolke.style.marginTop  = offsetY;

      // Herzchen in die Wolke einfügen
      herzPositionen.forEach(function (pos) {
        const h = document.createElement('span');
        h.textContent = '♡';
        h.style.left     = pos.left;
        h.style.top      = pos.top;
        h.style.fontSize = pos.size;
        wolke.appendChild(h);
      });

      // Animationsverzögerung leicht variieren
      const delay = (Math.random() * 0.2).toFixed(2) + 's';
      wolke.style.animationDelay = delay;

      overlay.appendChild(wolke);

      requestAnimationFrame(function () {
        wolke.classList.add('aufsteigen');
      });

      wolke.addEventListener('animationend', function () {
        wolke.remove();
      });
    }

    // Flugzeug starten
    var flugTimeout = null;
    var herzInterval = null;
    var formularAktiv = false;

    function stopFlug() {
      wrapper.classList.remove('flying');
      wrapper.style.opacity = '0';
      if (herzInterval)  { clearInterval(herzInterval);  herzInterval  = null; }
      if (flugTimeout)   { clearTimeout(flugTimeout);    flugTimeout   = null; }
      overlay.querySelectorAll('.flug-herzwolke').forEach(function (h) { h.remove(); });
    }

    function planNextFlug() {
      if (formularAktiv) return;
      const delay = Math.floor(Math.random() * 8000 + 12000);
      flugTimeout = setTimeout(startFlug, delay);
    }

    var ersterFlug = true;

    function startFlug() {
      if (formularAktiv) return;

      // Keine Animation im Hero-Bereich
      const heroSection = document.getElementById('start');
      if (heroSection) {
        const heroRect = heroSection.getBoundingClientRect();
        if (heroRect.bottom > 0) {
          flugTimeout = setTimeout(startFlug, 3000);
          return;
        }
      }

      // Boarding-Section aus Flugbereich ausschließen
      const boardingSection = document.getElementById('zusagen');
      if (boardingSection) {
        const rect   = boardingSection.getBoundingClientRect();
        const vpH    = window.innerHeight;
        if (rect.top < vpH && rect.bottom > 0) {
          flugTimeout = setTimeout(startFlug, 3000);
          return;
        }
      }

      // Erster Flug: zufällige Position im normalen Bereich
      var topVh;
      if (ersterFlug) {
        topVh = Math.floor(Math.random() * 46 + 10);
        ersterFlug = false;
      } else {
        topVh = Math.floor(Math.random() * 46 + 10);
      }
      wrapper.style.top     = topVh + 'vh';
      wrapper.style.opacity = '1';

      wrapper.classList.remove('flying');
      void wrapper.offsetWidth;

      herzInterval = setInterval(function () { spawnHerzWolke(true); }, 500);
      wrapper.classList.add('flying');

      wrapper.addEventListener('animationend', function onEnd() {
        wrapper.removeEventListener('animationend', onEnd);
        if (herzInterval)  { clearInterval(herzInterval);  herzInterval  = null; }
        wrapper.classList.remove('flying');
        wrapper.style.opacity = '0';
        planNextFlug();
      });
    }

    // Ersten Flug erst starten, wenn die Geschichte-Section vollständig gescrollt wurde
    function waitForGeschichte() {
      const geschichteSection = document.getElementById('geschichte');
      if (!geschichteSection) {
        flugTimeout = setTimeout(startFlug, 1000);
        return;
      }
      function checkGeschichte() {
        const rect = geschichteSection.getBoundingClientRect();
        // Erst starten wenn die Geschichte-Section den Viewport nach oben verlassen hat
        if (rect.bottom <= 0) {
          window.removeEventListener('scroll', checkGeschichte);
          flugTimeout = setTimeout(startFlug, 800);
        }
      }
      window.addEventListener('scroll', checkGeschichte, { passive: true });
    }
    waitForGeschichte();

    // Formularfelder: Animation sofort stoppen beim ersten Eingabe-Zeichen
    const formFelder = document.querySelectorAll('.zusagen-form input, .zusagen-form textarea, .zusagen-form select');
    formFelder.forEach(function (feld) {
      feld.addEventListener('focus', function () {
        formularAktiv = true;
        stopFlug();
      });
      // input-Event: auch beim Tippen sicherstellen
      feld.addEventListener('input', function () {
        formularAktiv = true;
        stopFlug();
      });
      feld.addEventListener('blur', function () {
        // Erst wieder erlauben wenn alle Felder leer sind
        var alleLeer = true;
        formFelder.forEach(function (f) {
          if (f.type === 'radio' || f.type === 'checkbox') return;
          if (f.value.trim() !== '') alleLeer = false;
        });
        if (alleLeer) {
          formularAktiv = false;
          planNextFlug();
        }
      });
    });

    // Herz-Explosion beim Absenden: viele Wolken gleichzeitig über den Bildschirm verteilen
    function herzExplosion() {
      const anzahl = 18;
      for (var i = 0; i < anzahl; i++) {
        (function (idx) {
          setTimeout(function () {
            var wolke = document.createElement('div');
            wolke.classList.add('flug-herzwolke');
            // Zufällige Position über die gesamte Viewport-Breite und -Höhe
            wolke.style.left = Math.floor(Math.random() * (window.innerWidth - 80)) + 'px';
            wolke.style.top  = Math.floor(Math.random() * (window.innerHeight - 80)) + 'px';

            var groessen = ['1.0em','1.3em','0.9em','1.5em','0.8em'];
            var positionen = [
              { left: '0px',  top: '10px', size: groessen[0] },
              { left: '18px', top: '0px',  size: groessen[1] },
              { left: '32px', top: '10px', size: groessen[2] },
              { left: '10px', top: '22px', size: groessen[3] },
              { left: '24px', top: '22px', size: groessen[4] },
            ];
            positionen.forEach(function (pos) {
              var h = document.createElement('span');
              h.textContent = '♡';
              h.style.left     = pos.left;
              h.style.top      = pos.top;
              h.style.fontSize = pos.size;
              wolke.appendChild(h);
            });

            overlay.appendChild(wolke);
            requestAnimationFrame(function () {
              wolke.classList.add('aufsteigen');
            });
            wolke.addEventListener('animationend', function () { wolke.remove(); });
          }, idx * 80);
        })(i);
      }
    }

    // Formular Submit
    var form = document.getElementById('zusagen-form');
    var toast = document.getElementById('zusagen-toast');
    var toastText = document.getElementById('zusagen-toast-text');

    if (form && toast) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var anwesenheit = form.querySelector('input[name="anwesenheit"]:checked');
        var isZusage = anwesenheit && anwesenheit.value === 'zusage';

        // Toast-Text und Icon je nach Auswahl
        if (isZusage) {
          toast.querySelector('.zusagen-toast-icon').innerHTML = '<svg viewBox="0 0 616.15 470.28" xmlns="http://www.w3.org/2000/svg" class="toast-flugzeug-svg"><path d="M317.76,261.37s-2.49-14.19-8.1-23.66c-5.6-9.46-36.12-50.27-36.12-50.27l-26.15-33.12s-16.19-18.04-22.42-20.7c-6.23-2.66,4.98-11.53,16.19-5.32,11.21,6.21,90.29,81.61,90.29,81.61l9.96.59s2.18-6.8,11.83-13.6c9.65-6.8,21.17-.3,24.29,5.91s4.98,15.08-3.42,19.81-18.99,3.84-18.99,3.84l10.59,15.38,29.27-8.87s10.59-5.03,29.89-8.87c19.3-3.84,26.78,5.91,26.78,5.91,0,0,8.1,14.49-18.68,29.57-26.78,15.08-47.32,22.47-47.32,22.47l-11.21,34.3s28.33-20.99,31.76,2.37c3.42,23.36-17.12,15.08-21.79,15.38-4.67.3-14.32,0-14.32,0,0,0-31.13,106.75-36.12,119.46-4.98,12.72-7.47,14.79-7.47,14.79,0,0-9.03,4.44-10.59-2.37s18.06-107.04,19.3-127.74c1.25-20.7-3.74-33.71-3.74-33.71l-47.95,20.11-32.38,13.6s-12.14,49.09-13.7,57.96c-1.56,8.87-8.1,8.28-8.1,8.28l-1.25-69.19s-23.97,5.62-37.36,7.69-26.78-1.18-26.78-1.18c0,0,4.98-9.17,21.79-13.6s36.74-11.24,36.74-11.24c0,0-28.96-47.02-33-55.59-4.05-8.58,3.74-7.39,9.34-2.37,5.6,5.03,39.23,43.76,44.21,45.54,4.98,1.77,74.72-43.17,74.72-43.17Z" fill="white"/></svg>';
          toastText.textContent = toastText.getAttribute('data-zusage') || 'Deine Sitzplätze sind gebucht!';
        } else {
          toast.querySelector('.zusagen-toast-icon').innerHTML = '♡';
          toastText.textContent = toastText.getAttribute('data-absage') || 'Schade, dass du nicht dabei bist!';
        }

        // Herz-Explosion
        herzExplosion();

        // Toast einblenden
        toast.classList.add('sichtbar');

        // Toast nach 4 Sekunden wieder ausblenden
        setTimeout(function () {
          toast.classList.remove('sichtbar');
        }, 4000);
      });
    }
  })();

  // ----------------------------------------------------------
  // BURGER MENÜ
  // ----------------------------------------------------------
  const burger = document.getElementById('burger');
  const navList = document.getElementById('nav-list');

  if (burger && navList) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('active');
      navList.classList.toggle('active');
    });

    // Menü schließen wenn ein Link geklickt wird
    document.querySelectorAll('#nav-list a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('active');
        navList.classList.remove('active');
      });
    });
  }

  // ----------------------------------------------------------
  // SMOOTH SCROLL
  // ----------------------------------------------------------
  const navLinks = document.querySelectorAll('.navigation a');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          window.scrollTo({
            top: target.offsetTop - 60,
            behavior: 'smooth'
          });
        }
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        this.classList.add('active');
      }
    });
  });

  // ----------------------------------------------------------
  // SPRACHUMSCHALTUNG
  // ----------------------------------------------------------
  function setLanguage(lang) {
    if (lang === 'de') {
      // Navigation
      document.querySelector('a[href="#geschichte"]').textContent = 'Unsere Geschichte';
      document.querySelector('a[href="#details"]').textContent = 'Details';
      document.querySelector('a[href="#anfahrt"]').textContent = 'Anfahrt';
      document.querySelector('a[href="#geschenke"]').textContent = 'Geschenke';
      document.querySelector('a[href="#zusagen"]').textContent = 'Zusagen';

      // Hero
      const heroTitle = document.querySelector('.hero-title');
      if (heroTitle) heroTitle.textContent = 'DIANA & JULIAN';
      const heroSub = document.querySelector('.hero-subtitle-text');
      if (heroSub) heroSub.textContent = 'Begleite uns auf unserem schönsten Abenteuer';

      // Geschichte – Überschrift
      const gTitle = document.querySelector('#geschichte .geschichte-title');
      if (gTitle) gTitle.textContent = 'UNSERE';
      const gTitle2 = document.querySelector('#geschichte .geschichte-title-2');
      if (gTitle2) gTitle2.innerHTML = '<span class="geschichte-dots-inline"></span>Geschichte<span class="geschichte-dots-inline"></span>';
      // Geschichte – Text
      const gBlockText = document.querySelector('#geschichte .geschichte-block-text');
      if (gBlockText) gBlockText.innerHTML = '<p>Nach einigen unerwarteten und wundersamen Wegen durch die Welt haben wir uns gefunden.</p><p>An einem sonnigen, wunderschönen Augusttag 2022 standen wir im Garten des Schlosses Koblenz und beobachteten die Hochzeit zweier Fremder, als uns eine etwas ungewöhnliche, aber herzliche Dame ihren kleinen „Segen" schenkte. Ihre Frage lautete: „Wann seid ihr so weit?" Heute können wir ihr endlich antworten: am <strong>29.05.2026</strong>!</p><p>Die Tage, Wochen, Monate und schließlich auch ein paar Jahre vergingen – noch nicht viele, erst drei –, und doch spüren wir bei jeder Umarmung dieses unglaubliche Gefühl, etwas gefunden zu haben, das wir vielleicht für unmöglich hielten: einen Traum, einen Schatz.</p><p>Doch nicht nur dieses Gefühl lässt uns heute sicher sein, diesen Schritt zu gehen. Es ist die Unterstützung, der Respekt und die Toleranz, die uns auch in Momenten tragen, in denen wir nicht einer Meinung sind. Es ist die Bereitschaft, uns jeden Tag als Individuen weiterzuentwickeln, die uns zeigt, dass wir jetzt bereit sind.</p><p>Und natürlich hat auch dieses „Etwas", das uns erlaubt, einander so zu lieben, wie wir sind, viel mit den Menschen zu tun, die uns durch unser Leben begleiten. Mit euch möchten wir diesen besonderen Moment teilen, denn durch euch sind wir zu den Menschen geworden, die wir heute sind.</p>';

      // Details – Überschrift
      const detailsTitle = document.querySelector('#details .geschichte-title');
      if (detailsTitle) detailsTitle.textContent = 'HOCHZEITS';
      const detailsTitle2 = document.querySelector('#details .geschichte-title-2');
      if (detailsTitle2) detailsTitle2.innerHTML = '<span class="geschichte-dots-inline geschichte-dots-dark"></span>Details<span class="geschichte-dots-inline geschichte-dots-dark"></span>';
      // Details – Inhalt
      const detailsTitles = document.querySelectorAll('.details-block-title');
      if (detailsTitles[0]) detailsTitles[0].textContent = 'Wann';
      if (detailsTitles[1]) detailsTitles[1].textContent = 'Wo';
      const detailsTexts = document.querySelectorAll('.details-block-text');
      if (detailsTexts[0]) detailsTexts[0].innerHTML = '<strong>Freitag, 29. Mai 2026</strong><br>Hochzeitszeremonie: 13:00 Uhr<br>Hochzeitsfeier: 19:00 Uhr';
      if (detailsTexts[1]) detailsTexts[1].innerHTML = 'Friedrichspark<br>Lindenstraße 507<br>10555 Berlin';

      // Anfahrt – Überschrift
      const anfahrtTitle = document.querySelector('#anfahrt .geschichte-title');
      if (anfahrtTitle) anfahrtTitle.textContent = 'INFOS';
      const anfahrtTitle2 = document.querySelector('#anfahrt .geschichte-title-2');
      if (anfahrtTitle2) anfahrtTitle2.innerHTML = '<span class="geschichte-dots-inline geschichte-dots-dark"></span>zur Anfahrt<span class="geschichte-dots-inline geschichte-dots-dark"></span>';
      // Anfahrt – Inhalt
      const anfahrtTitles = document.querySelectorAll('.anfahrt-box-title');
      if (anfahrtTitles[0]) anfahrtTitles[0].textContent = 'Transport';
      if (anfahrtTitles[1]) anfahrtTitles[1].textContent = 'Unterbringung';
      const anfahrtTexts = document.querySelectorAll('.anfahrt-box-text');
      if (anfahrtTexts[0]) anfahrtTexts[0].textContent = 'Ich bin ein Textabschnitt. Klicken Sie hier, um Ihren eigenen Text hinzuzufügen und mich zu bearbeiten. Hier können Sie Ihren Besuchern mehr erzählen.';
      if (anfahrtTexts[1]) anfahrtTexts[1].textContent = 'Ich bin ein Textabschnitt. Klicken Sie hier, um Ihren eigenen Text hinzuzufügen und mich zu bearbeiten. Hier können Sie Ihren Besuchern mehr erzählen.';

      // Geschenke – Überschrift
      const geschenkeTitle = document.querySelector('#geschenke .geschichte-title');
      if (geschenkeTitle) geschenkeTitle.textContent = 'GESCHENKE';
      const geschenkeTitle2 = document.querySelector('#geschenke .geschichte-title-2');
      if (geschenkeTitle2) geschenkeTitle2.innerHTML = '<span class="geschichte-dots-inline"></span>Danke<span class="geschichte-dots-inline"></span>';
      // Geschenke – Text & Link
      const geschenkeText = document.querySelector('#geschenke .geschichte-block-text');
      if (geschenkeText) geschenkeText.textContent = 'Das größte Geschenk ist eure gemeinsame Zeit mit uns. Wenn ihr uns zusätzlich etwas schenken möchtet, freuen wir uns über einen Beitrag für unser nächstes Reiseabenteuer.';
      const geschenkeLink = document.querySelector('.geschenke-link');
      if (geschenkeLink) geschenkeLink.textContent = 'Hier könnt ihr unsere Reisekasse füllen';

      // Boarding – Überschrift
      const zusagenTitle = document.querySelector('#zusagen .geschichte-title');
      if (zusagenTitle) zusagenTitle.textContent = 'BOARDING';
      const zusagenTitle2 = document.querySelector('#zusagen .geschichte-title-2');
      if (zusagenTitle2) zusagenTitle2.innerHTML = '<span class="geschichte-dots-inline geschichte-dots-dark"></span>Bitte<span class="geschichte-dots-inline geschichte-dots-dark"></span>';
      // Boarding – Formular
      const radioLabels = document.querySelectorAll('.zusagen-radio-group label span');
      if (radioLabels[0]) radioLabels[0].textContent = 'Check-in (an Bord gehen)';
      if (radioLabels[1]) radioLabels[1].textContent = 'Check-out (Leider nicht an Bord)';
      const vorname = document.querySelector('.zusagen-form input[placeholder="Nombre"]');
      if (vorname) vorname.placeholder = 'Vorname';
      const nachname = document.querySelector('.zusagen-form input[placeholder="Apellido"]');
      if (nachname) nachname.placeholder = 'Nachname';
      const email = document.querySelector('.zusagen-form input[placeholder="Correo electrónico"]');
      if (email) email.placeholder = 'E-Mail-Adresse';
      const telefon = document.querySelector('.zusagen-form input[placeholder="Teléfono (opcional)"]');
      if (telefon) telefon.placeholder = 'Telefon (optional)';
      const nachricht = document.querySelector('.zusagen-form textarea');
      if (nachricht) nachricht.placeholder = 'Besondere Hinweise, Wünsche oder Grüße....';
      const submitBtn = document.querySelector('.zusagen-form button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Abschicken';
      // Toast
      const toastTextEl = document.getElementById('zusagen-toast-text');
      if (toastTextEl) toastTextEl.textContent = 'Deine Sitzplätze sind gebucht!';
      toastTextEl && toastTextEl.setAttribute('data-zusage', 'Deine Sitzplätze sind gebucht!');
      toastTextEl && toastTextEl.setAttribute('data-absage', 'Schade, dass du nicht dabei bist!');
    }

    if (lang === 'es') {
      // Navigation
      document.querySelector('a[href="#geschichte"]').textContent = 'Nuestra Historia';
      document.querySelector('a[href="#details"]').textContent = 'Detalles';
      document.querySelector('a[href="#anfahrt"]').textContent = 'Cómo llegar';
      document.querySelector('a[href="#geschenke"]').textContent = 'Regalos';
      document.querySelector('a[href="#zusagen"]').textContent = 'Confirmar';

      // Hero
      const heroTitle = document.querySelector('.hero-title');
      if (heroTitle) heroTitle.textContent = 'DIANA & JULIAN';
      const heroSub = document.querySelector('.hero-subtitle-text');
      if (heroSub) heroSub.textContent = 'Acompáñanos en nuestra aventura más bonita';

      // Geschichte – Überschrift
      const gTitle = document.querySelector('#geschichte .geschichte-title');
      if (gTitle) gTitle.textContent = 'NUESTRA';
      const gTitle2 = document.querySelector('#geschichte .geschichte-title-2');
      if (gTitle2) gTitle2.innerHTML = '<span class="geschichte-dots-inline"></span>Historia<span class="geschichte-dots-inline"></span>';
      // Geschichte – Text
      const gBlockText = document.querySelector('#geschichte .geschichte-block-text');
      if (gBlockText) gBlockText.innerHTML = '<p>Después de dar algunas inimaginadas vueltas por el mundo, nos encontramos.</p><p>Un día de agosto, soleado, hermoso, ese día admirábamos una boda de extraños en el jardín del castillo de Koblenz cuando una extraña señora nos dio el flechazo, la bendición. Su pregunta: „y ustedes cuando se casan?" hoy podemos responderla: el <strong>29.05.2026</strong>!</p><p>Pasaban los días, semanas, meses y algunos años, aún no tantos, solo llevamos 3 pero aún, cada vez al abrazarnos podemos sentir esa increíble sensación de haber encontrado algo que tal vez creíamos imposible, un sueño, un tesoro.</p><p>Y no es eso lo que hoy nos hace estar seguros de dar este paso, es el apoyo, el respeto, la tolerancia que mantenemos en los momentos en los que no estamos tan de acuerdo, la disposición de mejorarnos individualmente cada día lo que nos hace estar seguros de que ahora estamos preparados!</p><p>Y por su puesto eso que nos hace amarnos como somos, tiene que ver mucho con esas personas que han estado a nuestro alrededor desde que llegamos a este mundo y con quienes quisiéramos compartir este hermoso momento, ya que por ustedes somos quien somos hoy.</p>';

      // Details – Überschrift
      const detailsTitle = document.querySelector('#details .geschichte-title');
      if (detailsTitle) detailsTitle.textContent = 'DETALLES';
      const detailsTitle2 = document.querySelector('#details .geschichte-title-2');
      if (detailsTitle2) detailsTitle2.innerHTML = '<span class="geschichte-dots-inline geschichte-dots-dark"></span>de la boda<span class="geschichte-dots-inline geschichte-dots-dark"></span>';
      // Details – Inhalt
      const detailsTitles = document.querySelectorAll('.details-block-title');
      if (detailsTitles[0]) detailsTitles[0].textContent = 'Cuándo';
      if (detailsTitles[1]) detailsTitles[1].textContent = 'Dónde';
      const detailsTexts = document.querySelectorAll('.details-block-text');
      if (detailsTexts[0]) detailsTexts[0].innerHTML = '<strong>Viernes, 29 de mayo de 2026</strong><br>Ceremonia: 13:00<br>Fiesta: 19:00';
      if (detailsTexts[1]) detailsTexts[1].innerHTML = 'Friedrichspark<br>Lindenstraße 507<br>10555 Berlín';

      // Anfahrt – Überschrift
      const anfahrtTitle = document.querySelector('#anfahrt .geschichte-title');
      if (anfahrtTitle) anfahrtTitle.textContent = 'CÓMO';
      const anfahrtTitle2 = document.querySelector('#anfahrt .geschichte-title-2');
      if (anfahrtTitle2) anfahrtTitle2.innerHTML = '<span class="geschichte-dots-inline geschichte-dots-dark"></span>llegar<span class="geschichte-dots-inline geschichte-dots-dark"></span>';
      // Anfahrt – Inhalt
      const anfahrtTitles = document.querySelectorAll('.anfahrt-box-title');
      if (anfahrtTitles[0]) anfahrtTitles[0].textContent = 'Transporte';
      if (anfahrtTitles[1]) anfahrtTitles[1].textContent = 'Alojamiento';
      const anfahrtTexts = document.querySelectorAll('.anfahrt-box-text');
      if (anfahrtTexts[0]) anfahrtTexts[0].textContent = 'Este es un texto de ejemplo. Haz clic aquí para añadir tu propio texto. Aquí puedes contar más a tus invitados.';
      if (anfahrtTexts[1]) anfahrtTexts[1].textContent = 'Este es un texto de ejemplo. Haz clic aquí para añadir tu propio texto. Aquí puedes contar más a tus invitados.';

      // Geschenke – Überschrift
      const geschenkeTitle = document.querySelector('#geschenke .geschichte-title');
      if (geschenkeTitle) geschenkeTitle.textContent = 'REGALOS';
      const geschenkeTitle2 = document.querySelector('#geschenke .geschichte-title-2');
      if (geschenkeTitle2) geschenkeTitle2.innerHTML = '<span class="geschichte-dots-inline"></span>Gracias<span class="geschichte-dots-inline"></span>';
      // Geschenke – Text & Link
      const geschenkeText = document.querySelector('#geschenke .geschichte-block-text');
      if (geschenkeText) geschenkeText.textContent = 'El mejor regalo es vuestro tiempo con nosotros. Si además queréis hacernos un regalo, nos alegrará mucho una contribución para nuestra próxima aventura viajera.';
      const geschenkeLink = document.querySelector('.geschenke-link');
      if (geschenkeLink) geschenkeLink.textContent = 'Aquí podéis llenar nuestra hucha de viajes';

      // Boarding – Überschrift
      const zusagenTitle = document.querySelector('#zusagen .geschichte-title');
      if (zusagenTitle) zusagenTitle.textContent = 'BOARDING';
      const zusagenTitle2 = document.querySelector('#zusagen .geschichte-title-2');
      if (zusagenTitle2) zusagenTitle2.innerHTML = '<span class="geschichte-dots-inline geschichte-dots-dark"></span>Por favor<span class="geschichte-dots-inline geschichte-dots-dark"></span>';
      // Boarding – Formular
      const radioLabels = document.querySelectorAll('.zusagen-radio-group label span');
      if (radioLabels[0]) radioLabels[0].textContent = 'Check-in (subir a bordo)';
      if (radioLabels[1]) radioLabels[1].textContent = 'Check-out (Lamentablemente no a bordo)';
      const vorname = document.querySelector('.zusagen-form input[placeholder="Vorname"]');
      if (vorname) vorname.placeholder = 'Nombre';
      const nachname = document.querySelector('.zusagen-form input[placeholder="Nachname"]');
      if (nachname) nachname.placeholder = 'Apellido';
      const email = document.querySelector('.zusagen-form input[placeholder="E-Mail-Adresse"]');
      if (email) email.placeholder = 'Correo electrónico';
      const telefon = document.querySelector('.zusagen-form input[placeholder="Telefon (optional)"]');
      if (telefon) telefon.placeholder = 'Teléfono (opcional)';
      const nachricht = document.querySelector('.zusagen-form textarea');
      if (nachricht) nachricht.placeholder = 'Indicaciones especiales, deseos o saludos...';
      const submitBtn = document.querySelector('.zusagen-form button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Enviar';
      // Toast
      const toastTextEl = document.getElementById('zusagen-toast-text');
      if (toastTextEl) toastTextEl.textContent = '¡Tus asientos están reservados!';
      // Toast-Texte für Spanisch merken
      toastTextEl && toastTextEl.setAttribute('data-zusage', '¡Tus asientos están reservados!');
      toastTextEl && toastTextEl.setAttribute('data-absage', '¡Qué pena que no puedas estar!');
    }
  }

  // Sprachfunktion global verfügbar machen (für onclick-Attribute)
  window.switchLanguage = setLanguage;

});
