

(function () {
  var root = document.documentElement;
  var q = new URLSearchParams(location.search);
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || q.get('motion') === 'off';
  if (reduce) root.classList.add('reduce');
  if (q.get('state') === 'final') root.classList.add('final');
  var still = reduce || root.classList.contains('final');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var hooks = (window.R2 = window.R2 || { frame: [] }).frame;

  var rv = [].slice.call(document.querySelectorAll('.rv, .wipe, [data-in]'));
  if (still || !('IntersectionObserver' in window)) rv.forEach(function (el) { el.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  }

  var nav = document.querySelector('.nav');
  var mb = document.querySelector('.menu-btn');
  if (mb) {
    mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });
    nav.querySelectorAll('ul a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); mb.setAttribute('aria-expanded', false); document.body.style.overflow = ''; }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { mb.click(); mb.focus(); } });
  }

  var films = [].slice.call(document.querySelectorAll('video[data-film]'));
  films.forEach(function (v) {
    v.muted = true; v.playsInline = true;
    if (still) { v.removeAttribute('autoplay'); v.pause(); return; }
    var fio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !v.dataset.held) v.play().catch(function () {}); else v.pause(); }); }, { threshold: v.hasAttribute('data-once') ? 0.55 : 0.05 });
    fio.observe(v);

    if (v.hasAttribute('data-once')) {
      v.loop = false;
      var host = v.closest('section') || v.parentElement;
      v.addEventListener('timeupdate', function () {
        if (v.duration && v.currentTime >= v.duration / 2 - 0.08 && !v.dataset.held) {
          v.dataset.held = 1; v.pause(); host.classList.add('held');
          var b = document.querySelector('.film-ctl[aria-controls="' + v.id + '"]'); if (b) { b.setAttribute('aria-label', 'Play film again'); b.innerHTML = PLAY; }
        }
      });
    }
  });

  document.querySelectorAll('[data-open-on-view]').forEach(function (sec) {
    if (still || !('IntersectionObserver' in window)) { sec.classList.add('held'); return; }
    var oio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { setTimeout(function () { sec.classList.add('held'); }, 450); oio.disconnect(); } }); }, { threshold: 0.4 });
    oio.observe(sec);
  });
  if (still) document.querySelectorAll('video[data-once]').forEach(function (v) { (v.closest('section') || v.parentElement).classList.add('held'); });
  document.querySelectorAll('.film-ctl').forEach(function (b) {
    var v = document.getElementById(b.getAttribute('aria-controls'));
    if (!v) return;
    if (still) { b.hidden = true; return; }
    b.addEventListener('click', function () {
      if (v.paused) { if (v.hasAttribute('data-once') && v.dataset.held) v.currentTime = 0; delete v.dataset.held; v.play(); b.setAttribute('aria-label', 'Pause film'); b.innerHTML = PAUSE; }
      else { v.dataset.held = 1; v.pause(); b.setAttribute('aria-label', 'Play film'); b.innerHTML = PLAY; }
    });
  });
  var PAUSE = '<svg viewBox="0 0 14 14"><rect x="2" y="1" width="3" height="12" fill="currentColor"/><rect x="9" y="1" width="3" height="12" fill="currentColor"/></svg>';
  var PLAY = '<svg viewBox="0 0 14 14"><path d="M3 1l10 6-10 6z" fill="currentColor"/></svg>';
  document.querySelectorAll('.film-ctl').forEach(function (b) { b.innerHTML = PAUSE; });

  var par = [].slice.call(document.querySelectorAll('[data-par]'));
  var runs = [].slice.call(document.querySelectorAll('[data-run]'));
  var bands = [].slice.call(document.querySelectorAll('[data-band]'));
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = innerHeight, y = scrollY;
    if (nav) nav.classList.toggle('slim', y > 40);
    if (!still) {
      par.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var off = (r.top + r.height / 2 - vh / 2);
        el.style.translate = '0 ' + (off * -parseFloat(el.dataset.par)).toFixed(1) + 'px';
      });
    }
    runs.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = still ? 1 : clamp((-r.top + vh * 0.05) / Math.max(1, r.height - vh));
      el.style.setProperty('--p', p.toFixed(4));
    });
    bands.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = still ? 1 : clamp((vh * 0.85 - (r.top + r.height / 2)) / (vh * 0.4));
      el.style.setProperty('--b', p.toFixed(4));
    });
    hooks.forEach(function (f) { f(still, vh, y); });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('load', onScroll);
  if (document.fonts) document.fonts.ready.then(onScroll);
  frame();
})();
