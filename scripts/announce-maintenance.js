#!/usr/bin/env node
// ─── ANNOUNCE MAINTENANCE / ANNOUNCEMENT ──────────────────────────────────────
// Poste une annonce dans le canal Discord #annonces (avec @everyone).
// Utilisé pour les maintenances planifiées, perturbations, ou grosses
// communications hors patch notes (qui passent par announce-update.js).
//
// Usage :
//   node scripts/announce-maintenance.js "<title>" "<message>"
//   node scripts/announce-maintenance.js "<title>" "<message>" --no-ping
//
// Webhook lu depuis ~/.config/zeldtrade/announcements_webhook (chmod 600).
// Ne JAMAIS commit l'URL — c'est un secret (équivalent à un token d'envoi).

'use strict';

const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const https = require('https');

// ── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const noPing = args.includes('--no-ping');
const positional = args.filter(a => !a.startsWith('--'));
if (positional.length < 2) {
  console.error('Usage: node scripts/announce-maintenance.js "<title>" "<message>" [--no-ping]');
  process.exit(1);
}
const [title, message] = positional;

if (title.length > 256) {
  console.error('✗ Titre > 256 chars (limite Discord)');
  process.exit(1);
}
if (message.length > 3800) {
  console.error('✗ Message > 3800 chars (limite Discord embed)');
  process.exit(1);
}

// ── Webhook ──────────────────────────────────────────────────────────────────
const webhookPath = path.join(os.homedir(), '.config', 'zeldtrade', 'announcements_webhook');
let webhookUrl;
try {
  webhookUrl = fs.readFileSync(webhookPath, 'utf8').trim();
} catch (e) {
  console.error(`✗ Webhook introuvable : ${webhookPath}`);
  console.error('  Crée le fichier avec : printf "URL" > ~/.config/zeldtrade/announcements_webhook && chmod 600 ~/.config/zeldtrade/announcements_webhook');
  process.exit(1);
}

// Validation regex (sécu : éviter d'envoyer à un domaine arbitraire si fichier corrompu)
const DISCORD_REGEX = /^https:\/\/discord\.com\/api\/webhooks\/\d{15,25}\/[A-Za-z0-9_-]{40,128}$/;
if (!DISCORD_REGEX.test(webhookUrl)) {
  console.error('✗ URL webhook invalide — doit matcher le pattern Discord standard.');
  process.exit(1);
}

// ── Embed ────────────────────────────────────────────────────────────────────
const embed = {
  title,
  description: message,
  color:       0xf59e0b,  // amber — couleur "info importante / attention"
  footer:      { text: 'ZeldTrade · Annonce officielle' },
  timestamp:   new Date().toISOString(),
};

const payload = JSON.stringify({
  username:   'ZeldTrade',
  avatar_url: 'https://zeldtrade.com/favicon.png',
  content:    noPing ? '' : '@everyone',
  allowed_mentions: noPing ? { parse: [] } : { parse: ['everyone'] },
  embeds:     [embed],
});

// ── POST ─────────────────────────────────────────────────────────────────────
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
      console.log(`✓ Annonce postée dans #annonces (HTTP ${res.statusCode})${noPing ? ' [pas de @everyone]' : ' [@everyone]'}`);
      process.exit(0);
    } else {
      console.error(`✗ Webhook a répondu HTTP ${res.statusCode}`);
      if (body) console.error('  ' + body.slice(0, 300));
      process.exit(1);
    }
  });
});
req.on('error',   (e) => { console.error('✗ Erreur réseau:', e.message); process.exit(1); });
req.on('timeout', ()  => { console.error('✗ Timeout 8s — webhook Discord injoignable.'); req.destroy(); process.exit(1); });
req.write(payload);
req.end();
