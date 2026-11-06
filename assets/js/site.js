// Bodhi Mind Wellness: small site behaviours (no libraries needed).
(function () {
  var root = document.documentElement;

  // Language switch. Retreat pages have a fixed language and a link to their translation.
  function setLang(lang) {
    try { localStorage.setItem('lang', lang); } catch (e) {}
    var fixed = root.getAttribute('data-page-lang');
    var alt = root.getAttribute('data-alt');
    if (fixed && fixed !== lang && alt) { window.location.href = alt; return; }
    root.setAttribute('data-lang', lang);
    root.lang = lang;
  }
  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-set-lang')); });
  });

  // Mobile menu.
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    var close = function () { document.body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.querySelectorAll('#site-nav a').forEach(function (a) { a.addEventListener('click', close); });
  }

  // YouTube: load the player only when someone clicks play.
  document.querySelectorAll('.video[data-yt]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var id = el.getAttribute('data-yt');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = 'YouTube video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      var box = document.createElement('div');
      box.className = 'video';
      box.appendChild(f);
      el.replaceWith(box);
    });
  });

  // Contact form (Web3Forms emails each message to Manjusha).
  function lang() { return root.getAttribute('data-lang') === 'fr' ? 'fr' : 'en'; }
  function translateOptions() {
    document.querySelectorAll('option[data-fr]').forEach(function (o) {
      if (!o.dataset.en) o.dataset.en = o.textContent;
      o.textContent = lang() === 'fr' ? o.dataset.fr : o.dataset.en;
    });
  }
  translateOptions();
  new MutationObserver(translateOptions).observe(root, { attributes: true, attributeFilter: ['data-lang'] });

  var MSG = {
    en: { demo: "Demo only: once connected, this message goes straight to Manjusha's inbox.",
          ok: "Thank you! Your message is on its way. We'll reply soon.",
          err: 'Sorry, that didn’t send. Please email bodhitara21@gmail.com or WhatsApp +230 5762 4109.',
          sending: 'Sending…' },
    fr: { demo: 'Démo : une fois connecté, ce message arrivera directement chez Manjusha.',
          ok: 'Merci ! Votre message est envoyé. Nous vous répondrons bientôt.',
          err: 'Désolé, l’envoi a échoué. Écrivez à bodhitara21@gmail.com ou sur WhatsApp au +230 5762 4109.',
          sending: 'Envoi…' }
  };
  document.querySelectorAll('form[data-web3forms]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    function say(key, kind) { status.hidden = false; status.textContent = MSG[lang()][key]; status.dataset.kind = kind; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = Object.fromEntries(new FormData(form));
      if (data.botcheck) return;
      if (!data.access_key || data.access_key.indexOf('YOUR_') === 0) { say('demo', 'info'); return; }
      var label = btn.innerHTML;
      btn.disabled = true; btn.textContent = MSG[lang()].sending;
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (!res.success) throw new Error(res.message);
        form.reset(); say('ok', 'ok');
      }).catch(function () { say('err', 'error'); })
        .finally(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });

  // Tabs (contact page). Forms load when their tab is first opened.
  var tabs = document.querySelectorAll('[role="tab"]');
  if (tabs.length) {
    var show = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('aria-controls') === 'panel-' + id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) {
          panel.querySelectorAll('iframe[data-src]').forEach(function (f) { f.src = f.getAttribute('data-src'); f.removeAttribute('data-src'); });
          if (focus) t.focus();
        }
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        var id = t.getAttribute('aria-controls').replace('panel-', '');
        show(id);
        history.replaceState(null, '', '#' + id);
      });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        var next = tabs[(i + d + tabs.length) % tabs.length];
        show(next.getAttribute('aria-controls').replace('panel-', ''), true);
      });
    });
    var fromHash = function () {
      var h = location.hash.replace('#', '');
      if (h && document.getElementById('panel-' + h)) {
        show(h);
        document.getElementById('forms').scrollIntoView();
      }
    };
    show(tabs[0].getAttribute('aria-controls').replace('panel-', ''));
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }
})();
