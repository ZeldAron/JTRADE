// ─── APP ──────────────────────────────────────────────────────────────────────
// Point d'entrée : routing, événements globaux, init (appelé après auth)

function initApp() {
  const $ = id => document.getElementById(id);

  // ── ROUTING ────────────────────────────────────────────────────────────────
  const PAGE_KEYS = {
    journal:   'page.journal',
    dashboard: 'page.dashboard',
    analytics: 'page.analytics',
    goals:     'page.goals',
    calendar:  'page.calendar',
    micro:     'page.micro',
    offers:    'page.offers',
    settings:  'page.settings',
  };

  let currentPage = 'journal';

  function switchPage(page) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    $('topbarTitle').textContent = i18n.t(PAGE_KEYS[page] || page);
    $('searchWrap').style.display = page === 'journal' ? 'flex' : 'none';
    currentPage = page;
    if (page === 'dashboard') UI.renderDashboard();
    if (page === 'analytics') UI.renderAnalytics();
    if (page === 'goals')     UI.renderGoals();
    if (page === 'calendar')  UI.renderCalendar();
    if (page === 'micro')     UI.renderMicro();
    if (page === 'offers')    UI.renderOffers();
  }

  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', () => switchPage(el.dataset.page));
  });

  // ── JOURNAL FILTERS ────────────────────────────────────────────────────────
  $('listFilters').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#listFilters .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    UI.setFilter(chip.dataset.filter);
  });

  // ── SEARCH ─────────────────────────────────────────────────────────────────
  $('searchInput').addEventListener('input', () => UI.renderList());

  // ── NEW TRADE BUTTON ───────────────────────────────────────────────────────
  $('btnNewTrade').addEventListener('click', () => {
    if (!Store.getMyAccounts().length) {
      UI.toast(i18n.t('err.no.account'), true);
      return;
    }
    Modal.open(null, saved => {
      UI.selectTrade(saved.id);
      UI.updateStats();
      UI.renderList();
    });
  });

  // ── KEYBOARD SHORTCUTS ─────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      $('btnNewTrade').click();
    }
    if (e.key === 'Escape') Modal.close();
  });

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  $('btnLogout').addEventListener('click', () => {
    Auth.logout();
    location.reload();
  });

  // ── INIT ───────────────────────────────────────────────────────────────────
  // Applique les traductions statiques
  i18n.apply();

  // Bouton langue dans Settings
  document.getElementById('btnToggleLang').addEventListener('click', () => {
    i18n.setLang(i18n.getLang() === 'fr' ? 'en' : 'fr');
    location.reload();
  });

  // Badge plan dans la sidebar
  const planBadge = $('planBadge');
  if (planBadge) {
    const isPro = Store.isPro();
    planBadge.textContent = isPro ? 'PRO' : 'BASIC';
    planBadge.className   = 'plan-badge ' + (isPro ? 'plan-pro' : 'plan-basic');
  }

  Modal.init();
  UI.initSettings();
  UI.renderList();
  UI.updateStats();

  const first = Store.getTrades()[0];
  if (first) UI.selectTrade(first.id);

  // ── AUTO-REFRESH EOD ───────────────────────────────────────────────────────
  // Re-rend les pages actives à minuit pour mettre à jour le plancher trailing
  let lastDate = new Date().toISOString().split('T')[0];
  setInterval(() => {
    const nowDate = new Date().toISOString().split('T')[0];
    if (nowDate !== lastDate) {
      lastDate = nowDate;
      if (currentPage === 'goals')     UI.renderGoals();
      if (currentPage === 'dashboard') UI.renderDashboard();
    }
  }, 60_000); // vérifie chaque minute
}
