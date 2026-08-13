'use strict';
/* Hero photo rotator - same H1/lede/CTA; photo only. Jared 2026-08-12.
   Cross-fade 6s. Pause on interaction. prefers-reduced-motion -> static first.
   CTA stays tappable (pointer-events none on slides). Preload slide 1 only. */
(function () {
  var root = document.querySelector('[data-hero-rotator]');
  if (!root) return;
  var slides = root.querySelectorAll('[data-hero-slide]');
  if (slides.length < 2) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (var i = 1; i < slides.length; i++) slides[i].style.display = 'none';
    return;
  }
  var i = 0;
  var paused = false;
  var timer = null;
  function show(n) {
    for (var k = 0; k < slides.length; k++) {
      slides[k].classList.toggle('is-active', k === n);
    }
    i = n;
  }
  function next() {
    if (paused) return;
    show((i + 1) % slides.length);
  }
  function arm() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 6000);
  }
  function pause() { paused = true; }
  function resume() { paused = false; }
  root.addEventListener('pointerdown', pause, { passive: true });
  root.addEventListener('pointerup', resume, { passive: true });
  root.addEventListener('mouseenter', pause);
  root.addEventListener('mouseleave', resume);
  root.addEventListener('focusin', pause);
  root.addEventListener('focusout', resume);
  show(0);
  arm();
})();
