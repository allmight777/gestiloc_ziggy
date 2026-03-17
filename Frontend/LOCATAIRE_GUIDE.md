# Guide d'exécution du module Locataire

## 📋 Vue d'ensemble

Le module **Locataire** (`src/pages/Locataire`) est une application React complète avec un tableau de bord pour les locataires. C'est une application autonome fonctionnellement isolée du site marketing principal.

## 📁 Structure du projet

```
src/pages/Locataire/
├── index.tsx              # Point d'entrée (montage React principal)
├── App.tsx                # Composant principal avec gestion des onglets
├── types.ts               # Définitions TypeScript des types
└── components/            # Tous les composants de l'application
    ├── Layout.tsx         # Mise en page générale
    ├── Dashboard.tsx      # Accueil du tableau de bord
    ├── Payments.tsx       # Gestion des paiements
    ├── Messages.tsx       # Système de messagerie
    ├── Interventions.tsx  # Demandes d'intervention
    ├── Documents.tsx      # Gestion des documents
    ├── DocumentViewer.tsx # Visualiseur de documents
    ├── Lease.tsx          # Contrat de location
    ├── Property.tsx       # Informations du bien
    ├── Profile.tsx        # Profil utilisateur
    ├── PaymentModal.tsx   # Modal de paiement
    └── ui/                # Composants UI réutilisables
```

## 🎯 Fonctionnalités principales

| Onglet | Fonction |
|--------|----------|
| **Dashboard** | Vue d'ensemble du compte locataire |
| **Paiements** | Historique et suivi des loyers |
| **Messages** | Communication avec propriétaire/agence |
| **Interventions** | Demandes de maintenance/réparation |
| **Documents** | Contrats, diagnostics, inventaires |
| **Bail** | Détails du contrat de location |
| **Bien** | Informations de la propriété |
| **Profil** | Paramètres utilisateur et déconnexion |

## 🚀 Comment exécuter le module Locataire

### Option 1 : Accéder via l'application principale (RECOMMANDÉ)

1. **Démarrer le serveur de développement** :
```bash
cd "c:\Users\abatt\Desktop\Projet Innovtech\gestiloc-marketing-kit"
bun run dev
```

2. **Ouvrir dans le navigateur** :
```
http://localhost:5173/
```

3. **Ajouter une route pour accéder au module Locataire** :
   - Modifier `src/App.tsx` pour ajouter la route (voir section "Intégration dans les routes")
   - Accéder via `http://localhost:5173/app/locataire`

### Option 2 : Modifier le fichier App.tsx pour intégrer Locataire

Ajoutez cette ligne aux imports dans `src/App.tsx` :

```tsx
import LocataireApp from "./pages/Locataire/App";
```

Puis ajoutez cette route dans le `<Routes>` :

```tsx
<Route path="/app/locataire" element={<LocataireApp />} />
```

Ensuite, démarrez l'application :

```bash
bun run dev
```

Et accédez à : `http://localhost:5173/app/locataire`

### Option 3 : Créer une HTML de test dédiée

Vous pouvez créer un point d'entrée alternatif pour tester uniquement l'application Locataire.

1. **Créer un fichier `locataire.html`** à la racine du projet :

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GestiLoc - Espace Locataire</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/pages/Locataire/index.tsx"></script>
  </body>
</html>
```

2. **Mettre à jour `vite.config.ts`** pour supporter plusieurs points d'entrée :

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        locataire: resolve(__dirname, 'locataire.html'),
      },
    },
  },
});
```

3. **Démarrer avec Vite** :
```bash
bun run dev
```

L'application Locataire sera accessible à `http://localhost:5173/locataire.html` ou `/locataire`

## 📊 Architecture et flux de données

### Structure du composant principal (`App.tsx`)

```
App (gestion des onglets + toasts)
├── state: activeTab (onglet actif)
├── state: toasts (notifications)
├── Layout (structure générale)
│   └── renderContent() → Affiche le composant de l'onglet actif
└── Composants enfants (reçoivent notify + setActiveTab)
    ├── Dashboard
    ├── Payments
    ├── Messages
    ├── Interventions
    ├── Documents
    ├── Lease
    ├── Property
    └── Profile
```

### Système de notifications (Toast)

Les toasts sont gérés au niveau du composant `App` et passés à chaque enfant :

```typescript
const notify = (message: string, type: 'success' | 'error' | 'info') => {
  // Crée une notification
};

const removeToast = (id: number) => {
  // Supprime une notification
};
```

## 🔧 Types disponibles

Fichier : `src/pages/Locataire/types.ts`

### Types principaux :

```typescript
export type Tab = 'home' | 'payments' | 'messages' | 'interventions' | 'documents' | 'lease' | 'property' | 'profile';

export interface Payment {
  id: string;
  month: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  datePaid?: string;
}

export interface Message {
  id: string;
  sender: 'me' | 'owner' | 'agency';
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Intervention {
  id: string;
  title: string;
  type: 'Plomberie' | 'Électricité' | 'Chauffage' | 'Autre';
  status: 'En cours' | 'Terminé' | 'Planifié';
  date: string;
  provider?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'diagnostic' | 'charge' | 'inventory';
  date: string;
}
```

## 🎨 Composants UI utilisés

L'application utilise les composants shadcn/ui :
- `Button`, `Card`, `Badge`, `Tabs`, `Dialog`, `Input`, `Textarea`
- `Select`, `DatePicker`, `ScrollArea`, `AlertDialog`
- `Toast` pour les notifications
- `Drawer` pour les modales mobiles

## 🧪 Commandes utiles

```bash
# Démarrer le serveur de développement
bun run dev

# Build pour la production
bun run build

# Vérifier les erreurs ESLint
bun run lint

# Aperçu de la build
bun run preview
```

## 📝 Notes importantes

1. **L'application est actuellement en mode simulation** - Les données sont fictives
2. **Aucune authentification réelle** - Implémentez un système d'auth avant déploiement
3. **Pas d'API backend** - À intégrer avec votre backend
4. **Mode responsive** - Fonctionne sur desktop et mobile
5. **Système de toast** - Toutes les actions affichent des notifications

## 🔗 Intégration dans l'application principale

Pour intégrer Locataire à l'application marketing complète, modifiez `src/App.tsx` :

```tsx
// 1. Importer le composant
import LocataireApp from "./pages/Locataire/App";

// 2. Ajouter la route
<Route path="/app/locataire" element={<LocataireApp />} />

// 3. Ajouter un lien de navigation dans le header
// (vers "/app/locataire")
```

## ✅ Vérification de l'installation

Pour vérifier que tout fonctionne correctement :

```bash
# 1. Vérifier les dépendances
bun install

# 2. Vérifier la syntaxe
bun run lint

# 3. Builder l'application
bun run build

# 4. Lancer en dev et tester
bun run dev
# Accédez à http://localhost:5173
```

Si tout fonctionne, vous verrez un serveur Vite qui démarre sans erreur ! 🎉
