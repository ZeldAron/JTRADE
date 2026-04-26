// ─── PAGE OFFRES ──────────────────────────────────────────────────────────────

UI.renderOffers = function () {
  const el = document.getElementById('page-offers');
  const plan = Store.getPlanInfo();
  const isPro = plan.plan === 'pro';

  el.innerHTML = `
    <div class="offers-wrap">
      <div class="offers-header">
        <h1>Choisissez votre offre</h1>
        <p>Tous vos trades et données restent stockés localement — aucun compte en ligne requis.</p>
      </div>

      <div class="offers-cards">

        <!-- BASIC -->
        <div class="offer-card ${!isPro ? 'offer-current' : ''}">
          <div class="offer-badge-current" style="opacity:${!isPro ? 1 : 0}">Plan actuel</div>
          <div class="offer-name">Basic</div>
          <div class="offer-price">Gratuit</div>
          <div class="offer-price-sub">pour toujours</div>
          <ul class="offer-features">
            <li class="ok">Journal de trading illimité</li>
            <li class="ok">Dashboard &amp; Analytics</li>
            <li class="ok">Suivi objectifs Apex</li>
            <li class="ok">Export / Import JSON</li>
            <li class="ok">Calendrier</li>
            <li class="ok">Simulateur micro-entrepreneur</li>
            <li class="limit">1 compte de trading</li>
            <li class="limit">1 analyse IA par jour</li>
            <li class="no">Groupes de comptes</li>
          </ul>
          ${!isPro ? '<div class="offer-cta offer-cta-current">Votre plan actuel</div>' : ''}
        </div>

        <!-- PRO -->
        <div class="offer-card offer-pro ${isPro ? 'offer-current' : ''}">
          <div class="offer-badge-pro">PRO</div>
          <div class="offer-badge-current" style="opacity:${isPro ? 1 : 0}">Plan actuel</div>
          <div class="offer-name">Pro</div>
          <div class="offer-price" id="offerProPrice">${isPro ? 'Actif' : 'Code requis'}</div>
          <div class="offer-price-sub">${isPro ? 'activé le ' + new Date(plan.activatedAt).toLocaleDateString('fr-FR') : 'entrez votre code ci-dessous'}</div>
          <ul class="offer-features">
            <li class="ok">Tout le plan Basic</li>
            <li class="ok"><strong>Comptes illimités</strong></li>
            <li class="ok"><strong>Analyses IA illimitées</strong></li>
            <li class="ok"><strong>Groupes de comptes</strong></li>
            <li class="ok">Support prioritaire</li>
            <li class="ok">Accès aux futures fonctionnalités</li>
          </ul>

          ${isPro
            ? `<div class="offer-cta offer-cta-current">Actif ✓</div>`
            : `<div class="offer-activate">
                <input type="text" id="proCodeInput" class="pro-code-input"
                  placeholder="JTRADE-PRO-XXXX" autocomplete="off" spellcheck="false" />
                <button class="offer-cta offer-cta-pro" id="btnActivatePro">Activer Pro</button>
                <div class="pro-code-error" id="proCodeError"></div>
              </div>`
          }
        </div>

      </div>

      <div class="offers-faq">
        <h3>Questions fréquentes</h3>
        <div class="faq-item">
          <b>Où sont stockées mes données ?</b>
          <p>Dans votre navigateur (localStorage). Rien n'est envoyé sur un serveur.</p>
        </div>
        <div class="faq-item">
          <b>Le plan Pro est-il lié à un appareil ?</b>
          <p>Oui, le code active le plan sur le navigateur où vous l'entrez. Sur un autre appareil, saisissez à nouveau le code.</p>
        </div>
        <div class="faq-item">
          <b>Comment obtenir un code Pro ?</b>
          <p>Contactez-nous pour recevoir votre code d'activation.</p>
        </div>
      </div>
    </div>
  `;

  if (!isPro) {
    document.getElementById('btnActivatePro').addEventListener('click', () => {
      const code  = document.getElementById('proCodeInput').value;
      const error = document.getElementById('proCodeError');
      if (!code.trim()) { error.textContent = 'Entrez votre code d\'activation.'; return; }
      const ok = Store.activatePro(code);
      if (ok) {
        UI.toast('Plan Pro activé ! Rechargement…');
        setTimeout(() => location.reload(), 1200);
      } else {
        error.textContent = 'Code invalide. Vérifiez votre code ou contactez le support.';
      }
    });

    document.getElementById('proCodeInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btnActivatePro').click();
    });
  }
};
