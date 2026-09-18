/* Breda Pastel Studio — live-assistant behaviour (v1.1.0)
   Three small jobs, no dependencies, no frameworks:
   1. mark the document so the CSS can hide .bps-reveal before the observer runs
   2. reveal sections as they enter the viewport (skipped under prefers-reduced-motion)
   3. scroll-spy the sticky nav, and light up the timeline block that is happening now
   The page must read perfectly with this file missing: it only adds polish. */
(function () {
  var doc = document.documentElement;
  doc.classList.add('bps-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1 + 2. reveal on scroll */
  var revealables = [].slice.call(document.querySelectorAll('.bps-reveal'));
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('bps-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('bps-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* 3a. scroll-spy: underline the link of the section in view */
  var links = [].slice.call(document.querySelectorAll('.bps-navlinks a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = byId[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* 3b. the timeline block that is running right now (only on the page's own day) */
  var tl = document.querySelector('[data-day]');
  if (tl) {
    var now = new Date();
    var iso = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    if (iso === tl.getAttribute('data-day')) {
      [].slice.call(tl.querySelectorAll('[data-from]')).forEach(function (li) {
        var p = li.getAttribute('data-from').split(':');
        var mins = (+p[0]) * 60 + (+p[1]);
        var cur = now.getHours() * 60 + now.getMinutes();
        if (cur >= mins && cur < mins + 90) li.setAttribute('data-now', 'true');
      });
    }
  }
})();
