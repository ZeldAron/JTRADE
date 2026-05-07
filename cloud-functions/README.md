# Cloud Functions — Proxy Groq

Ce dossier contient le code à déployer sur Firebase Cloud Functions pour
proxifier les appels à l'API Groq depuis le serveur. Cela protège la clé Groq
de l'exposition côté client et permet de **vraiment** enforce le quota
"1 analyse / jour" pour les utilisateurs Basic (impossible à bypasser via
DevTools).

## Pré-requis

- Node.js 18+ installé
- Firebase CLI installée : `npm install -g firebase-tools`
- Tu dois avoir le rôle Owner ou Editor sur le projet Firebase

## Déploiement (étape par étape)

### 1. Initialiser Firebase Functions à la racine du projet

```bash
cd /Users/aaron/Documents/JTRADE
firebase login
firebase init functions
```

Choisis :
- **Use an existing project** → ton projet ZeldTrade
- **Language** : `JavaScript`
- **ESLint** : optionnel (No)
- **Install dependencies** : Yes

Cela crée un dossier `functions/` à la racine.

### 2. Copier le code

Copie le contenu de `cloud-functions/index.js` vers `functions/index.js`.
Copie aussi `cloud-functions/package.json` vers `functions/package.json`
(ou merge-le si tu as des deps existantes).

```bash
cp cloud-functions/index.js functions/index.js
cp cloud-functions/package.json functions/package.json
cd functions && npm install
```

### 3. Stocker la clé Groq comme secret

```bash
firebase functions:secrets:set GROQ_API_KEY
# Colle ta clé Groq quand demandé (gsk_xxx...)
```

### 4. Déployer

```bash
firebase deploy --only functions
```

Tu verras l'URL de la fonction à la fin.

### 5. Activer App Check pour les Cloud Functions (optionnel mais recommandé)

Dans Firebase Console → App Check → APIs → **Cloud Functions** → Enforce.

### 6. Modifier le client

Dans `src/js/modal.js`, remplace l'appel direct à `https://api.groq.com/...` par :

```js
const callable = firebase.functions().httpsCallable('analyzeChart');
const result = await callable({
  prompt,
  imageB64,
});
const groqResponse = result.data;
```

Tu dois aussi charger le SDK Functions dans `index.html` :

```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-functions-compat.js"></script>
```

Et retirer la lecture de `Store.getGroqKey()` côté client (la clé n'est plus
nécessaire côté navigateur — elle reste sur Firebase Secrets uniquement).

## Coût

Firebase Cloud Functions sur le plan **Blaze (pay-as-you-go)** :
- 2M invocations gratuites / mois
- 400 000 GB-secondes gratuits / mois
- En dessous de ces seuils → 0 €

Pour ZeldTrade en bêta, tu seras très loin de ces seuils.

⚠️ **Le plan Blaze nécessite une carte de crédit liée**. C'est gratuit dans la
limite mais tu dois activer la facturation. Va dans Firebase Console → Settings → Plan.
