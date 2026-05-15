#!/usr/bin/env node
// ─── ANNONCE DE MISE À JOUR DISCORD ────────────────────────────────────────────
// Poste un embed Discord (reproduisant le format de la page Mises à jour de l'app)
// dans le canal public #mises-à-jour du serveur ZeldTrade HQ.
//
// Usage : node scripts/announce-update.js v0.9.X
//
// Prérequis : fichier ~/.config/zeldtrade/updates_webhook contenant l'URL du
// webhook Discord, avec permissions chmod 600.

'use strict';

const fs    = require('fs');
const path  = require('path');
const vm    = require('vm');
const https = require('https');
const os    = require('os');

const VERSION = process.argv[2];
if (!VERSION || !/^v\d+\.\d+\.\d+$/.test(VERSION)) {
  console.error('Usage: node scripts/announce-update.js v0.9.X');
  process.exit(1);
}
const versionNum = VERSION.replace(/^v/, '');

// ── Webhook ───────────────────────────────────────────────────────────────────
const webhookFile = path.join(os.homedir(), '.config/zeldtrade/updates_webhook');
let webhookUrl;
try {
  const stat = fs.statSync(webhookFile);
  const perms = (stat.mode & 0o777).toString(8);
  if (perms !== '600') {
    console.error(`✗ ${webhookFile} doit être chmod 600 (actuel: ${perms})`);
    console.error(`  Fix : chmod 600 ${webhookFile}`);
    process.exit(1);
  }
  webhookUrl = fs.readFileSync(webhookFile, 'utf8').trim();
} catch (e) {
  console.error(`✗ Webhook absent : ${webhookFile}`);
  console.error(`  Crée le fichier avec l'URL du webhook Discord, puis chmod 600.`);
  process.exit(1);
}

const WEBHOOK_RE = /^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\/\d{15,25}\/[A-Za-z0-9_-]{40,128}$/;
if (!WEBHOOK_RE.test(webhookUrl)) {
  console.error('✗ URL webhook invalide dans ' + webhookFile);
  process.exit(1);
}

// ── Charge le changelog (sandbox VM, pas d'exécution dangereuse) ─────────────
const changelogPath = path.join(__dirname, '..', 'src', 'js', 'pages', 'changelog.js');
// Note : changelog.js utilise `const Changelog = (() => {...})()`. En VM sandbox,
// les `const` top-level ne sont PAS exposés sur l'objet sandbox. On wrappe donc
// le code pour réassigner explicitement.
const code = fs.readFileSync(changelogPath, 'utf8') + '\nthis.Changelog = Changelog;';
const sandbox = {};
vm.createContext(sandbox);
try {
  vm.runInContext(code, sandbox, { timeout: 2000 });
} catch (e) {
  console.error('✗ Erreur lors du chargement du changelog:', e.message);
  process.exit(1);
}
if (!sandbox.Changelog || typeof sandbox.Changelog.getEntries !== 'function') {
  console.error('✗ Changelog.getEntries non disponible — vérifier l\'export dans changelog.js');
  process.exit(1);
}

const entries = sandbox.Changelog.getEntries();
const entry = entries.find(e => e.version === versionNum);
if (!entry) {
  console.error(`✗ Version ${VERSION} introuvable dans changelog.js`);
  console.error(`  Versions disponibles (5 dernières) : ${entries.slice(0, 5).map(e => 'v' + e.version).join(', ')}`);
  process.exit(1);
}

// ── Mode USER-FACING uniquement ───────────────────────────────────────────────
// On ne poste sur Discord QUE si l'entrée a un champ `user` (texte simplifié
// pour les utilisateurs). Les modifs purement techniques (refactor, cleanup,
// sécu invisible) n'ont pas ce champ → skip (pas d'annonce).
if (!entry.user || !entry.user.title) {
  console.error(`✗ v${entry.version} n'est pas marquée user-facing.`);
  console.error(`  Pour l'annoncer, ajoute un champ \`user: { title, items: [...] }\``);
  console.error(`  dans l'entrée correspondante de src/js/pages/changelog.js`);
  process.exit(1);
}
const userTitle = entry.user.title;
const userItems = Array.isArray(entry.user.items) ? entry.user.items : [];

// ── Mapping emoji par type d'item / tag ──────────────────────────────────────
const EMOJI = {
  feat:        '✨',
  fix:         '🐛',
  security:    '🔒',
  revert:      '⏪',
  refactor:    '♻️',
  ux:          '🎨',
  mobile:      '📱',
  a11y:        '♿',
  privacy:     '🔐',
  infra:       '⚙️',
  integration: '🔌',
  ui:          '🎨',
  compact:     '📏',
  cleanup:     '🧹',
  bug:         '🐞',
  i18n:        '🌍',
};

const bullets = userItems
  .map(it => `${EMOJI[it.type] || '•'} ${it.text}`)
  .join('\n\n');

let description = bullets || '_(pas de détails)_';
if (description.length > 3900) {
  description = description.slice(0, 3900) + '\n\n_…_';
}

// ── Construction de l'embed (version user-facing simplifiée) ─────────────────
const embed = {
  title:       `🚀 v${entry.version} — ${userTitle}`,
  description,
  color:       0x6366f1,
  footer:      { text: 'ZeldTrade · zeldtrade.com' },
  timestamp:   new Date(`${entry.date}T${(entry.time || '12:00')}:00.000Z`).toISOString(),
};

const payload = JSON.stringify({
  username:   'ZeldTrade Updates',
  avatar_url: 'https://zeldtrade.com/favicon.png',
  embeds:     [embed],
});

// ── POST au webhook ──────────────────────────────────────────────────────────
const u = new URL(webhookUrl);
const req = https.request({
  hostname: u.hostname,
  path:     u.pathname + u.search,
  method:   'POST',
  headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
  timeout:  8000,
}, (res) => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`✓ Annonce v${entry.version} envoyée à #mises-à-jour (HTTP ${res.statusCode})`);
      process.exit(0);
    } else {
      console.error(`✗ Webhook a répondu HTTP ${res.statusCode}`);
      if (body) console.error('  ' + body.slice(0, 200));
      process.exit(1);
    }
  });
});
req.on('error',   (e) => { console.error('✗ Erreur réseau:', e.message); process.exit(1); });
req.on('timeout', ()  => { console.error('✗ Timeout 8s — webhook Discord injoignable.'); req.destroy(); process.exit(1); });
req.write(payload);
req.end();
