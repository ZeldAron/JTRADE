# Migration GitHub Pages → Firebase Hosting

> Plan d'action pour migrer le frontend de `zeldaron.github.io/zeldtrade` vers
> `zeldtrade.web.app` (gratuit, free tier 10 GB/mois). Permet d'avoir les **vrais
> headers HTTP** (HSTS, CSP, X-Frame-Options) au lieu de `<meta>` partiellement
> ignoré sur GitHub Pages.

---

## ✨ Pourquoi migrer

- **Vrais headers HTTP** : HSTS, CSP, X-Frame-Options, Permissions-Policy → enforceables (vs `<meta>` partiellement ignoré)
- **URL plus pro** : `zeldtrade.web.app` au lieu de `zeldaron.github.io/zeldtrade`
- **0€** : free tier 10 GB stockage + 10 GB transfert/mois
- **Branchement domaine custom plus tard** : `zeldtrade.com` se branche en 5 min sur Firebase Hosting
- **Auto SSL** : certificat Let's Encrypt managé
- **Rollback facile** : `firebase hosting:clone` ou `firebase deploy --only hosting`

## 📋 Étapes de migration

### 1. Init Firebase Hosting (1 min, manuel)

```bash
cd /Users/aaron/Documents/JTRADE
firebase init hosting
```

Réponses :
- `What do you want to use as your public directory?` → **`src`**
- `Configure as a single-page app (rewrite all urls to /index.html)?` → **`No`** (l'app a `/admin.html`, `/payment.html`, etc.)
- `Set up automatic builds and deploys with GitHub?` → **`No`** (on garde `scripts/release.sh`)
- Si demande d'écraser `index.html` → **`No`**

### 2. Remplacer le bloc `hosting` dans `firebase.json` par cette config

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "disallowLegacyRuntimeConfig": true,
      "ignore": ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log", "*.local"]
    }
  ],
  "firestore": { "rules": "firestore.rules" },
  "storage": { "rules": "storage.rules" },
  "hosting": {
    "public": "src",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "cleanUrls": false,
    "trailingSlash": false,
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=63072000; includeSubDomains; preload"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), serial=(), hid=(), idle-detection=(), screen-wake-lock=(), display-capture=(), picture-in-picture=(), autoplay=(), encrypted-media=(), publickey-credentials-get=(), publickey-credentials-create=(), interest-cohort=(), browsing-topics=(), join-ad-interest-group=(), run-ad-auction=()"
          },
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin"
          },
          {
            "key": "Cross-Origin-Resource-Policy",
            "value": "same-origin"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://www.gstatic.com https://www.google.com https://www.recaptcha.net https://cdnjs.cloudflare.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://firebase.googleapis.com https://firebaseappcheck.googleapis.com https://content-firebaseappcheck.googleapis.com https://firebasestorage.googleapis.com https://*.firebasestorage.app https://*.firebaseio.com wss://*.firebaseio.com wss://firestore.googleapis.com https://europe-west1-zeldtrade.cloudfunctions.net https://*.run.app https://api.frankfurter.app https://hcaptcha.com https://*.hcaptcha.com https://www.google.com https://www.recaptcha.net https://apis.google.com; img-src 'self' data: blob: https://www.gstatic.com/recaptcha/ https://firebasestorage.googleapis.com https://*.firebasestorage.app; frame-src https://hcaptcha.com https://*.hcaptcha.com https://www.google.com https://www.recaptcha.net https://zeldtrade.firebaseapp.com; frame-ancestors 'none'; form-action 'self'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests"
          }
        ]
      },
      {
        "source": "/admin.html",
        "headers": [
          { "key": "X-Robots-Tag", "value": "noindex, nofollow, noarchive" }
        ]
      },
      {
        "source": "**/*.@(js|css|svg|webp|jpg|jpeg|png)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=3600, must-revalidate" }
        ]
      },
      {
        "source": "/**/*.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      }
    ]
  }
}
```

### 3. Tester en local

```bash
firebase emulators:start --only hosting
# Ouvre http://localhost:5000 (ou le port indiqué)
# Vérifier que l'app charge et que les headers sont bien envoyés (F12 → Network → Response Headers)
```

### 4. Deploy en prod

```bash
firebase deploy --only hosting
# → URL : https://zeldtrade.web.app
```

### 5. Vérifier les headers en prod

```bash
curl -sI https://zeldtrade.web.app/ | grep -iE "strict-transport|x-frame|content-security|permissions-policy"
```

Tu dois voir TOUS les headers en réponse.

### 6. Update `ALLOWED_ORIGINS` côté Cloud Functions (optionnel mais propre)

Dans `functions/index.js`, ajouter `https://zeldtrade.web.app` :

```js
const ALLOWED_ORIGINS = [
  'https://zeldaron.github.io',    // legacy GitHub Pages
  'https://zeldtrade.web.app',     // ⬅ nouveau Firebase Hosting
  // 'https://zeldtrade.com',       // ⬅ futur domaine custom
];
```

Redeploy : `firebase deploy --only functions`

### 7. Tester l'app complète depuis `zeldtrade.web.app`

- Login admin + user
- Création trade + screenshot
- Analyse IA
- Vérifier console F12 : aucune erreur CSP

### 8. Bascule progressive (recommandé)

1. **Phase A** (1 semaine) : annoncer la nouvelle URL aux bêta-testeurs, garder GitHub Pages actif en parallèle
2. **Phase B** : ajouter une bannière sur `zeldaron.github.io/zeldtrade` qui redirige vers `zeldtrade.web.app`
3. **Phase C** : désactiver GitHub Pages (Settings → Pages → Source: None)

### 9. (Plus tard) Custom domain `zeldtrade.com`

Une fois le domaine acheté chez Cloudflare Registrar (~10€/an) :

```bash
# Dans Firebase Console → Hosting → Add custom domain
# Suivre la procédure : ajouter TXT pour verification, puis A/AAAA records
```

Firebase auto-provisionne le cert SSL en quelques minutes.

---

## 📜 Soumettre à HSTS Preload List

Une fois `zeldtrade.com` actif avec HSTS depuis 6+ mois sans interruption :

1. Vérifier : https://hstspreload.org → entrer `zeldtrade.com`
2. Si OK → soumettre la demande
3. Une fois inscrit → tous les navigateurs forceront HTTPS pour ton domaine, **avant même le premier accès**

C'est le top du top en sécurité transport.

---

## 🔒 Récap sécurité gagnée par cette migration

| Item | GitHub Pages (actuel) | Firebase Hosting (après) |
|---|---|---|
| HSTS | ❌ (impossible en meta) | ✅ 2 ans + preload |
| CSP enforced | ⚠️ partiel (meta) | ✅ vrai header |
| X-Frame-Options | ⚠️ partiel | ✅ vrai header |
| Permissions-Policy | ⚠️ partiel | ✅ vrai header |
| Cross-Origin-Opener-Policy | ❌ | ✅ |
| Cross-Origin-Resource-Policy | ❌ | ✅ |
| Cache-Control HTML | ❌ ignoré | ✅ no-cache |
| Cache-Control assets | partiel | ✅ 1h public |
| Score Mozilla Observatory | F | A+ attendu |
| Score SSL Labs | A | A+ attendu |

---

## ⚠️ Points d'attention

1. **CSP réelle plus stricte** : la migration permet de retirer `'unsafe-inline'` du `script-src` éventuellement (déjà OK), mais garder `'unsafe-inline'` sur `style-src` (beaucoup d'inline styles dans le code)
2. **Caching** : les fichiers JS sont versionnés via `?v=X.Y.Z` donc cache 1h est OK ; HTML en no-cache pour que les bumps de version soient pris en compte immédiatement
3. **Admin.html** : ajout du `X-Robots-Tag` pour éviter l'indexation Google (en plus du meta noindex)
4. **Frame-ancestors** : DENY total (pas d'embed possible)
5. **Permissions-Policy** : désactive proactivement camera/micro/geo/payment/USB/etc.

## 🆘 Rollback rapide si problème

```bash
# Si l'app ne charge pas après deploy
firebase hosting:rollback   # revient à la version précédente
```
