#!/usr/bin/env node
// ─── ZELDTRADE NEWSLETTER SENDER ─────────────────────────────────────────────
// Envoie une newsletter aux utilisateurs ayant opt-in (`userEmails.newsletterOptIn`).
//
// Usage :
//   node scripts/send-newsletter.js newsletter-v0.9.150.html         (envoi réel)
//   node scripts/send-newsletter.js newsletter-v0.9.150.html --dry   (dry-run, n'envoie pas)
//
// Prérequis :
//   - `~/.config/zeldtrade/brevo_smtp` : password SMTP Brevo (chmod 600)
//   - `cd scripts && npm install`     : installation de nodemailer
//   - Sender vérifié sur Brevo (zeldtradepro@gmail.com pour l'instant ;
//     news@zeldtrade.com une fois le domaine DKIM/SPF configuré)
//
// Le script :
//   1. Initialise firebase-admin (depuis functions/node_modules)
//   2. Query Firestore : userEmails.newsletterOptIn == true
//   3. Lit le HTML de la newsletter depuis le fichier passé en argument
//   4. Envoie via SMTP Brevo avec un délai entre chaque mail (anti-rate-limit)
//   5. Log succès/échec par destinataire + résumé final

'use strict';

const fs        = require('fs');
const path      = require('path');
const os        = require('os');
const nodemailer = require('nodemailer');
const admin     = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));

// ─── Args ────────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const dryRun = args.includes('--dry');
const htmlFile = args.filter(a => !a.startsWith('--'))[0];

if (!htmlFile) {
  console.error('Usage : node scripts/send-newsletter.js <fichier.html> [--dry]');
  console.error('Exemple : node scripts/send-newsletter.js newsletter-v0.9.150.html --dry');
  process.exit(1);
}

const htmlPath = path.isAbsolute(htmlFile) ? htmlFile : path.join(__dirname, htmlFile);
if (!fs.existsSync(htmlPath)) {
  console.error(`✗ Fichier introuvable : ${htmlPath}`);
  process.exit(1);
}

// ─── SMTP credentials ────────────────────────────────────────────────────────
const SMTP_HOST = 'smtp-relay.brevo.com';
const SMTP_PORT = 587;
const SMTP_USER = 'ab7a14001@smtp-brevo.com';  // Login Brevo (visible dans le dashboard)
const SMTP_PASS_PATH = path.join(os.homedir(), '.config', 'zeldtrade', 'brevo_smtp');

let SMTP_PASS;
try {
  SMTP_PASS = fs.readFileSync(SMTP_PASS_PATH, 'utf8').trim();
} catch (e) {
  if (!dryRun) {
    console.error(`✗ SMTP password introuvable : ${SMTP_PASS_PATH}`);
    console.error('  Crée-le avec : printf "TA_CLE" > ~/.config/zeldtrade/brevo_smtp && chmod 600 ~/.config/zeldtrade/brevo_smtp');
    process.exit(1);
  }
  // En mode --dry, on peut tester sans clé SMTP (pas d'envoi)
  SMTP_PASS = '';
}

// ─── Newsletter config ───────────────────────────────────────────────────────
const FROM_NAME  = 'ZeldTrade News';  // Match le sender configuré dans Brevo
const FROM_EMAIL = 'news@zeldtrade.com';  // Custom domain authentifié DKIM/DMARC dans Brevo
// Reply-To : les utilisateurs qui répondent atterrissent ici (news@ n'est pas une vraie inbox)
const REPLY_TO   = 'zeldtradepro@gmail.com';
const SUBJECT    = process.env.NEWSLETTER_SUBJECT || '🚀 ZeldTrade — Migration zeldtrade.com + grosses MAJ';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function htmlToText(html) {
  // Conversion HTML → texte brut minimaliste (pour le plain-text fallback)
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ZELDTRADE NEWSLETTER SENDER');
  console.log(`  Mode : ${dryRun ? 'DRY-RUN (aucun envoi)' : 'ENVOI RÉEL'}`);
  console.log(`  HTML : ${path.basename(htmlPath)}`);
  console.log('═══════════════════════════════════════════════════════');

  // Init Firebase Admin (utilise ADC ou GOOGLE_APPLICATION_CREDENTIALS)
  admin.initializeApp({ projectId: 'zeldtrade' });
  const db = admin.firestore();

  // Récupère les opt-ins
  console.log('\n→ Query Firestore : userEmails.newsletterOptIn == true...');
  const snap = await db.collection('userEmails').where('newsletterOptIn', '==', true).get();
  const recipients = snap.docs.map(d => {
    const data = d.data();
    return { uid: d.id, email: data.email, username: data.username };
  }).filter(r => r.email && r.email.includes('@'));

  console.log(`  → ${recipients.length} destinataire(s) opt-in trouvé(s).`);
  if (recipients.length === 0) {
    console.log('\n⚠ Aucun destinataire. Fin.');
    process.exit(0);
  }
  recipients.forEach(r => console.log(`    • ${r.username || '?'} <${r.email}>`));

  // Lit le HTML
  const html = fs.readFileSync(htmlPath, 'utf8');
  const text = htmlToText(html);
  console.log(`\n→ HTML chargé : ${html.length} chars, plain text : ${text.length} chars.`);

  if (dryRun) {
    console.log('\n✓ DRY-RUN — pas d\'envoi. Aperçu texte brut :\n');
    console.log('───────────────────────────────────────');
    console.log(text.slice(0, 500) + (text.length > 500 ? '\n[...truncated]' : ''));
    console.log('───────────────────────────────────────');
    process.exit(0);
  }

  // Setup Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,  // STARTTLS sur 587
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // Verify connection
  console.log('\n→ Vérification connexion SMTP Brevo...');
  try {
    await transporter.verify();
    console.log('  ✓ Connexion OK.');
  } catch (e) {
    console.error('  ✗ Échec connexion SMTP :', e.message);
    process.exit(1);
  }

  // Send loop
  console.log('\n→ Envoi des newsletters...');
  let okCount = 0;
  let errCount = 0;
  const errors = [];

  for (const r of recipients) {
    try {
      const info = await transporter.sendMail({
        from:    `"${FROM_NAME}" <${FROM_EMAIL}>`,
        replyTo: REPLY_TO,  // v0.9.150 : réponses redirigées vers la vraie boîte admin
        to:      r.email,
        subject: SUBJECT,
        text:    text,
        html:    html,
        // List-Unsubscribe header (RFC 8058) — Gmail/Outlook affichent un bouton se désinscrire
        list: {
          unsubscribe: {
            url:     'https://zeldtrade.com/app',
            comment: 'Réglages → Notifications email → toggle off',
          },
        },
      });
      okCount++;
      console.log(`  ✓ ${r.email} → ${info.messageId}`);
    } catch (e) {
      errCount++;
      errors.push({ email: r.email, error: e.message });
      console.error(`  ✗ ${r.email} → ${e.message}`);
    }
    // Anti-rate-limit : 1s entre chaque envoi (Brevo free = 300/jour = ~12.5/h)
    if (recipients.indexOf(r) < recipients.length - 1) await sleep(1000);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  RÉSUMÉ : ${okCount} envoyé(s), ${errCount} erreur(s).`);
  if (errors.length) {
    console.log('  Erreurs détaillées :');
    errors.forEach(e => console.log(`    ✗ ${e.email} : ${e.error}`));
  }
  console.log('═══════════════════════════════════════════════════════');

  process.exit(errCount > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('✗ Erreur fatale :', e);
  process.exit(1);
});
