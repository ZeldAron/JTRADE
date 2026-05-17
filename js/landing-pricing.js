// ─── LANDING PRICING TOGGLE ─────────────────────────────────────────────────
// v0.9.198 : toggle mensuel/annuel sur la section #pricing.
// Externalisé pour respecter la CSP (script-src 'self').

(function () {
  'use strict';
  const btns = document.querySelectorAll('.lp-billing-btn');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const billing = btn.getAttribute('data-lp-billing');
      btns.forEach(b => {
        const isActive = b.getAttribute('data-lp-billing') === billing;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      document.querySelectorAll('[data-lp-price-monthly]').forEach(p => {
        p.style.display = billing === 'monthly' ? '' : 'none';
      });
      document.querySelectorAll('[data-lp-price-yearly]').forEach(p => {
        p.style.display = billing === 'yearly' ? '' : 'none';
      });
    });
  });
})();
