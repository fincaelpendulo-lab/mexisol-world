// MexiSol World: mobile menu, dropdowns, cookie consent, analytics events,
// YouTube facade and the registration form. No dependencies.
(function () {
  'use strict';

  var body = document.body;
  var CONSENT_KEY = 'mexisol-consent-v1';

  /* ---------- Storage (may be blocked) ---------- */
  function readConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  /* ---------- Header: dropdowns and mobile menu ---------- */
  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var dropdowns = Array.prototype.slice.call(document.querySelectorAll('[data-dropdown]'));
  var mobileQuery = window.matchMedia('(max-width: 1239px)');

  function setDropdown(li, open) {
    li.classList.toggle('is-open', open);
    li.querySelector('button').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeDropdowns(except) {
    dropdowns.forEach(function (li) { if (li !== except) setDropdown(li, false); });
  }
  dropdowns.forEach(function (li) {
    var btn = li.querySelector('button');
    btn.addEventListener('click', function () {
      var open = !li.classList.contains('is-open');
      if (!mobileQuery.matches) closeDropdowns(li);
      setDropdown(li, open);
    });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && li.classList.contains('is-open') && !mobileQuery.matches) {
        setDropdown(li, false);
        btn.focus();
        e.stopPropagation();
      }
    });
    li.addEventListener('focusout', function (e) {
      if (!mobileQuery.matches && !li.contains(e.relatedTarget)) setDropdown(li, false);
    });
  });
  document.addEventListener('click', function (e) {
    if (!mobileQuery.matches && !e.target.closest('[data-dropdown]')) closeDropdowns();
  });

  function focusables() {
    return [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled])')))
      .filter(function (el) { return el.offsetParent !== null; });
  }
  function setMenu(open, returnFocus) {
    header.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Close' : 'Menu';
    if (open) {
      header.style.setProperty('--menu-top', header.getBoundingClientRect().bottom + 'px');
      var first = menu.querySelector('a, button');
      if (first) first.focus();
    } else {
      closeDropdowns();
      if (returnFocus) toggle.focus();
    }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (!header.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setMenu(false, true); return; }
      if (e.key !== 'Tab') return;
      var items = focusables();
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    mobileQuery.addEventListener('change', function () { setMenu(false); });
  }

  /* ---------- Analytics (GA4, only after consent) ---------- */
  var gaId = body.getAttribute('data-ga');
  var gaLoaded = false;
  function loadAnalytics() {
    if (!gaId || gaLoaded) return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
  }
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var kind = a.getAttribute('data-track');
    var url = a.href;
    if (kind === 'register') track('register_click', { link_url: url });
    else if (kind === 'whatsapp' || /wa\.me\//.test(url)) track('whatsapp_click', { link_url: url });
    else if (kind === 'booking' || /cloudbeds\.com/.test(url)) track('booking_click', { link_url: url });
    else if (/instagram\.com/.test(url)) track('outbound_instagram', { link_url: url });
    else if (/youtube\.com|youtu\.be/.test(url)) track('outbound_youtube', { link_url: url });
  });

  /* ---------- Cookie consent ---------- */
  var banner = document.querySelector('[data-cookie-banner]');
  var options = document.querySelector('[data-cookie-options]');
  var consent = readConsent();

  function applyConsent(c) {
    window.gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    if (c.analytics) loadAnalytics();
  }
  function showBanner(customize) {
    if (!banner) return;
    banner.hidden = false;
    body.classList.add('banner-open');
    var c = consent || { analytics: false, media: false };
    options.analytics.checked = !!c.analytics;
    options.media.checked = !!c.media;
    setCustomize(!!customize);
  }
  function hideBanner() {
    banner.hidden = true;
    body.classList.remove('banner-open');
  }
  function setCustomize(open) {
    options.hidden = !open;
    banner.querySelector('[data-cookie="customize"]').setAttribute('aria-expanded', open ? 'true' : 'false');
    banner.querySelector('[data-cookie="customize"]').hidden = open;
    banner.querySelector('[data-cookie="save"]').hidden = !open;
    if (open) options.analytics.focus();
  }
  function choose(c) {
    consent = { analytics: !!c.analytics, media: !!c.media, at: new Date().toISOString() };
    writeConsent(consent);
    applyConsent(consent);
    hideBanner();
  }
  if (banner) {
    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cookie]');
      if (!btn) return;
      var action = btn.getAttribute('data-cookie');
      if (action === 'accept') choose({ analytics: true, media: true });
      else if (action === 'reject') choose({ analytics: false, media: false });
      else if (action === 'customize') setCustomize(true);
      else if (action === 'save') choose({ analytics: options.analytics.checked, media: options.media.checked });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-cookie-settings]'), function (b) {
      b.addEventListener('click', function () { showBanner(true); });
    });
    if (consent) applyConsent(consent); else showBanner(false);
  }

  /* ---------- YouTube facade (youtube-nocookie, loads on click) ---------- */
  function playVideo(el) {
    var id = el.getAttribute('data-youtube');
    var title = el.getAttribute('data-title') || 'Video';
    var frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
    frame.title = title;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    var box = document.createElement('div');
    box.className = 'yt';
    box.appendChild(frame);
    el.replaceWith(box);
    frame.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-youtube]'), function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (consent && consent.media) { playVideo(el); return; }
      if (el.querySelector('.yt-consent')) return;
      var note = document.createElement('div');
      note.className = 'yt-consent';
      note.innerHTML = '<p class="t-body">This video plays from YouTube, which may set cookies on your device.</p>' +
        '<p class="cluster"><button type="button" class="ms-btn ms-btn--on-photo" data-yt-allow>Allow and play</button>' +
        '<a class="ms-btn ms-btn--on-photo" href="' + el.getAttribute('href') + '" data-track="outbound">Watch on YouTube</a></p>';
      el.appendChild(note);
      note.querySelector('[data-yt-allow]').addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        consent = Object.assign({ analytics: false }, consent || {}, { media: true, at: new Date().toISOString() });
        writeConsent(consent);
        playVideo(el);
      });
      note.querySelector('[data-yt-allow]').focus();
    });
  });

  /* ---------- Background drone video (wide screens only) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-video-band]'), function (band) {
    var conn = navigator.connection || {};
    if (!window.matchMedia('(min-width: 761px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || conn.saveData) return;
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('aria-hidden', 'true');
    v.preload = 'auto';
    var webm = band.getAttribute('data-webm');
    if (webm) { var s1 = document.createElement('source'); s1.src = webm; s1.type = 'video/webm'; v.appendChild(s1); }
    var s2 = document.createElement('source'); s2.src = band.getAttribute('data-mp4'); s2.type = 'video/mp4'; v.appendChild(s2);
    var pic = band.querySelector('picture, img');
    pic.insertAdjacentElement('afterend', v);
    var btn = band.querySelector('[data-video-toggle]');
    btn.hidden = false;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      var paused = btn.getAttribute('aria-pressed') === 'true';
      if (paused) { v.play(); btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-label', 'Pause the background video'); }
      else { v.pause(); btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Play the background video'); }
    });
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: the photo stays */ });
  });

  /* ---------- Registration form ---------- */
  var form = document.querySelector('[data-register-form]');
  if (form) {
    var status = form.querySelector('[data-form-status]');
    var started = Date.now();
    var startedField = form.querySelector('[name="_started"]');
    if (startedField) startedField.value = String(started);
    var whatsapp = form.getAttribute('data-whatsapp');
    var messages = {
      name: 'Please write your full name.',
      email: 'Please write an email address like name@example.com.',
      phone: 'Please write your WhatsApp number with the country code, like +52 378 790 0992.',
    };
    var phoneRe = /^\+?[0-9\s().-]{7,20}$/;

    // Load Cloudflare Turnstile only when the form is close to view.
    var turnstileLoaded = false;
    function loadTurnstile() {
      if (turnstileLoaded || !form.querySelector('.cf-turnstile')) return;
      turnstileLoaded = true;
      // Explicit rendering: the script loads late, so Turnstile would not find the widget by itself.
      window.mexisolTurnstile = function () {
        var box = form.querySelector('.cf-turnstile');
        if (box && !box.hasChildNodes()) {
          window.turnstile.render(box, { sitekey: box.getAttribute('data-sitekey'), size: 'flexible', theme: 'light' });
        }
      };
      var t = document.createElement('script');
      t.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=mexisolTurnstile';
      t.async = true;
      document.head.appendChild(t);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) { loadTurnstile(); io.disconnect(); }
      }, { rootMargin: '600px' });
      io.observe(form);
    } else { loadTurnstile(); }
    form.addEventListener('focusin', loadTurnstile);

    function fieldError(input) {
      var v = input.value.trim();
      if (input.name === 'name') return v.length < 2 ? messages.name : '';
      if (input.name === 'email') return !v || !input.validity.valid ? messages.email : '';
      if (input.name === 'phone') return v && !phoneRe.test(v) ? messages.phone : '';
      return '';
    }
    function showError(input, msg) {
      var err = document.getElementById(input.id + '-error');
      if (err) err.textContent = msg;
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    function setStatus(state, html) {
      status.setAttribute('data-state', state);
      status.innerHTML = html;
    }
    var checked = Array.prototype.slice.call(form.querySelectorAll('[data-validate]'));
    checked.forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value) showError(input, fieldError(input)); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) showError(input, fieldError(input)); });
    });

    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      checked.forEach(function (input) {
        var msg = fieldError(input);
        showError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) {
        setStatus('error', '<p>Some details need a second look. Check the fields marked below.</p>');
        firstBad.focus();
        return;
      }
      var fail = '<p>We could not send your request just now. Write to us on <a href="' + whatsapp + '" data-track="whatsapp">WhatsApp</a> and we will answer there.</p>';
      var endpoint = form.getAttribute('action');
      if (!endpoint || endpoint === '#') { setStatus('error', fail); return; }
      var data = new FormData(form);
      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      setStatus('sending', '<p>Sending…</p>');
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok !== false, j: j }; }); })
        .then(function (res) {
          if (res.ok) {
            track('form_submit', { form: 'register', retreat: data.get('retreat') || '' });
            form.reset();
            setStatus('ok', '<p>Thank you. We have your request and will write back to set up a call.</p>');
          } else {
            setStatus('error', fail);
          }
        })
        .catch(function () { setStatus('error', fail); })
        .then(function () {
          btn.disabled = false;
          if (window.turnstile) try { window.turnstile.reset(); } catch (err) { /* ignore */ }
          status.focus();
        });
    });
  }
})();
