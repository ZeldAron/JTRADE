// ─── LANDING SCROLL ANIMATIONS ─────────────────────────────────────────────
// v0.9.204 : fade-in subtil au scroll via IntersectionObserver.
// Externalisé pour respecter la CSP (script-src 'self').
// Respecte prefers-reduced-motion (accessibilité).

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  if (!('IntersectionObserver' in window)) return;

  const TARGETS = [
    '.section',
    '.ba-col',
    '.pillar',
    '.mini-feat',
    '.usecase-card',
    '.roadmap-col',
    '.how-step',
    '.feature',
    '.pricing-card',
  ];

  const els = document.querySelectorAll(TARGETS.join(','));
  if (!els.length) return;

  els.forEach((el, i) => {
    el.classList.add('lp-anim-init');
    el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + 'ms';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('lp-anim-in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
  });

  els.forEach(el => observer.observe(el));
})();
