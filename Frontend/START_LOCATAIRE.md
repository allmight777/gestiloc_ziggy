# 🚀 Démarrage rapide - Module Locataire

## Trois façons d'exécuter le module Locataire

### 1️⃣ Accès rapide (PLUS FACILE)

```bash
cd "c:\Users\abatt\Desktop\Projet Innovtech\gestiloc-marketing-kit"
bun run dev
```

Puis ouvrez dans votre navigateur :
```
http://localhost:5173/app/locataire
```

✅ **C'est tout !** L'application Locataire est maintenant accessible !

---

## 2️⃣ Variables d'environnement utiles

Si vous avez besoin de configurer l'API :

```bash
# Créer un fichier .env.local
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=GestiLoc
```

---

## 3️⃣ Dépannage

### Le serveur ne démarre pas ?

```bash
# Nettoyer et réinstaller les dépendances
rm -r node_modules bun.lockb
bun install
bun run dev
```

### Des erreurs TypeScript ?

```bash
# Vérifier la compilation
bun run lint
```

### Port 5173 déjà utilisé ?

Vite utilisera automatiquement le port suivant (5174, 5175, etc.)

---

## 4️⃣ Ce que vous pouvez faire dans Locataire

✅ **Dashboard** - Voir un aperçu du compte
✅ **Paiements** - Gérer les loyers (simulation)
✅ **Messages** - Communiquer avec le propriétaire
✅ **Interventions** - Signaler des problèmes
✅ **Documents** - Consulter contrats et diagnostics
✅ **Profil** - Gérer ses informations
✅ **Toast Notifications** - Feedback en temps réel
✅ **Navigation par onglets** - Interface fluide

---

## 5️⃣ Structure du code

```
src/pages/Locataire/
├── App.tsx              ← Point d'entrée principal
├── types.ts             ← Tous les types TypeScript
├── components/
│   ├── Layout.tsx       ← Mise en page
│   ├── Dashboard.tsx    ← Page d'accueil
│   ├── Payments.tsx     ← Paiements
│   ├── Messages.tsx     ← Messagerie
│   ├── Interventions.tsx
│   ├── Documents.tsx
│   ├── Profile.tsx
│   └── ... autres composants
```

---

## 6️⃣ Commandes disponibles

```bash
# Démarrer en développement
bun run dev

# Build pour production
bun run build

# Vérifier linting
bun run lint

# Prévisualiser la build
bun run preview
```

---

## 🎯 Prochaines étapes

1. **Connecter une API réelle** → Remplacer les données fictives
2. **Ajouter l'authentification** → Système de login/logout
3. **Ajouter une base de données** → Persister les données
4. **Optimiser les chunks** → Code-splitting avec React Suspense
5. **Tester sur mobile** → Vérifier la responsivité

---

## 📞 Besoin d'aide ?

Consultez `LOCATAIRE_GUIDE.md` pour plus de détails sur :
- L'architecture interne
- Les types disponibles
- L'intégration avec le backend
- Les composants UI utilisés

Bon développement ! 🎉
