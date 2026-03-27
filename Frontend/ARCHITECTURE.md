# 🎨 Architecture visuelle du module Locataire

## Structure du projet

```
imona-marketing-kit/
│
├── src/
│   ├── App.tsx                          ← Route intégrée ici
│   ├── main.tsx
│   ├── index.css
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── ... autres pages ...
│   │   │
│   │   └── Locataire/                   ⭐ MODULE PRINCIPAL
│   │       ├── index.tsx                   (Point d'entrée)
│   │       ├── App.tsx                     (Composant racine)
│   │       ├── types.ts                    (Types TypeScript)
│   │       │
│   │       └── components/
│   │           ├── Layout.tsx              (Conteneur principal)
│   │           ├── Dashboard.tsx           (Page d'accueil)
│   │           ├── Payments.tsx            (Gestion paiements)
│   │           ├── Messages.tsx            (Messagerie)
│   │           ├── Interventions.tsx       (Maintenance)
│   │           ├── Documents.tsx           (Gestion docs)
│   │           ├── DocumentViewer.tsx      (Visualiseur)
│   │           ├── Lease.tsx               (Contrat)
│   │           ├── Property.tsx            (Bien immobilier)
│   │           ├── Profile.tsx             (Profil)
│   │           ├── PaymentModal.tsx        (Modal paiement)
│   │           │
│   │           └── ui/                     (Composants réutilisables)
│   │               ├── Badge.tsx
│   │               ├── Button.tsx
│   │               ├── Card.tsx
│   │               ├── Dialog.tsx
│   │               └── ... 40+ composants ...
│   │
│   ├── components/                      (Composants marketing)
│   ├── hooks/
│   ├── lib/
│   └── assets/
│
├── public/
├── dist/                                (Production build)
├── package.json
├── bun.lockb
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
└── Documentation/
    ├── LOCATAIRE_GUIDE.md               📚 Guide complet
    ├── START_LOCATAIRE.md               🚀 Démarrage rapide
    ├── ANALYSE_LOCATAIRE.md             📊 Rapport complet
    ├── ARCHITECTURE.md                  🎨 Ce fichier
    └── start-locataire.bat              🖥️  Script Windows
```

---

## Flux d'exécution

```
1. Navigateur accède à http://localhost:5173/app/locataire
                    ↓
2. React Router charge <LocataireApp />
                    ↓
3. App.tsx initialise l'état (activeTab, toasts)
                    ↓
4. Layout.tsx rend la structure UI
                    ↓
5. Sidebar affiche les onglets disponibles
                    ↓
6. renderContent() affiche le composant actif
                    ↓
7. Composant reçoit (notify, onNavigate) en props
                    ↓
8. Utilisateur interagit
                    ↓
9. Composant appelle notify() pour feedback
                    ↓
10. Toast notification s'affiche
                    ↓
11. Auto-masquage après 3-5 secondes
```

---

## Hiérarchie des composants

```
├─ App.tsx (STATE ROOT)
│  ├─ activeTab: Tab
│  ├─ toasts: ToastMessage[]
│  └─ notify(): void
│
└─ Layout.tsx (UI CONTAINER)
   ├─ Header
   │  └─ Branding, navigation
   │
   ├─ Sidebar
   │  └─ Onglets de navigation
   │     ├─ Dashboard
   │     ├─ Payments
   │     ├─ Messages
   │     ├─ Interventions
   │     ├─ Documents
   │     ├─ Lease
   │     ├─ Property
   │     └─ Profile
   │
   ├─ Main Content (dynamique)
   │  └─ Composant actuel basé sur activeTab
   │     ├─ Dashboard.tsx
   │     ├─ Payments.tsx
   │     ├─ Messages.tsx
   │     ├─ Interventions.tsx
   │     ├─ Documents.tsx
   │     ├─ Lease.tsx
   │     ├─ Property.tsx
   │     └─ Profile.tsx
   │
   ├─ Footer
   │  └─ Copyright, liens
   │
   └─ Toasts Container
      └─ Affichage des notifications
         └─ Toast[] + removeToast()
```

---

## Flux de données

```
                    User Action
                        ↓
        ┌───────────────────────────────┐
        │                               │
    Dashboard        Payments       Messages
        │                │              │
        └────────────────┼──────────────┘
                         ↓
                  notify(message)
                         ↓
        ┌─────────────────────────────────┐
        │   App.tsx (Toast Management)    │
        ├─────────────────────────────────┤
        │ - Ajoute le toast à l'état     │
        │ - Affiche pendant 3-5s         │
        │ - Supprime automatiquement      │
        └─────────────────────────────────┘
                         ↓
                 Toast Notification
                    (Visuelle)
```

---

## État de l'application

### Gestion d'état centralisée (App.tsx)

```typescript
// État principal
const [activeTab, setActiveTab] = useState<Tab>('home');
const [toasts, setToasts] = useState<ToastMessage[]>([]);

// Dérivé des props
const renderContent = () => {
  switch(activeTab) {
    case 'home': return <Dashboard onNavigate={setActiveTab} />;
    case 'payments': return <Payments />;
    // ... autres cas ...
  }
};

// Chaque changement d'onglet déclenche un re-rendu
// Les composants reçoivent notify() pour créer des toasts
```

### Props passées aux enfants

```typescript
interface ChildComponentProps {
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  onNavigate?: (tab: Tab) => void;
}
```

---

## Cycle de vie des composants

### Au chargement

```
Utilisateur accède à /app/locataire
        ↓
App.tsx monte
        ↓
État initialisé (activeTab='home', toasts=[])
        ↓
Layout monte
        ↓
Dashboard monte (composant par défaut)
        ↓
Page affichée ✅
```

### Lors d'un changement d'onglet

```
Utilisateur clique sur "Paiements"
        ↓
Appel à onNavigate('payments')
        ↓
setActiveTab('payments')
        ↓
App re-rendue
        ↓
renderContent() retourne <Payments />
        ↓
Payments composant monte
        ↓
Page mise à jour ✅
```

### Cycle d'une notification

```
notify('Paiement effectué', 'success')
        ↓
Toast créé avec ID unique
        ↓
Ajouté à l'état toasts[]
        ↓
Toast rendu avec animation
        ↓
Après 3-5 secondes
        ↓
removeToast(id) appelé
        ↓
Supprimé de l'état
        ↓
Notification disparaît ✅
```

---

## Flux de navigation

```
                    ┌─────────────────────┐
                    │   Layout.tsx        │
                    │   (Navigation)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ┌───────▼────────┐    ┌──────▼────────┐
            │   Dashboard    │    │   Payments    │
            │   (home)       │    │   (payments)  │
            └────────────────┘    └───────────────┘
                    ▲
                    │
                    └─────────────────────┐
                                          │
            ┌───────────────────────────┐ │
            │   Sidebar Navigation      │ │
            │   • Dashboard (active)    │─┘
            │   • Payments              │
            │   • Messages              │
            │   • Interventions         │
            │   • Documents             │
            │   • Lease                 │
            │   • Property              │
            │   • Profile               │
            └───────────────────────────┘
```

---

## Intégration avec l'app principale

```
Main App (src/App.tsx)
│
├─ Routes (React Router)
│  │
│  ├─ Route: / → Home (avec AppShell)
│  ├─ Route: /login → Login (avec AppShell)
│  ├─ Route: /app/demo → Demo (sans AppShell)
│  │
│  └─ Route: /app/locataire → LocataireApp ⭐ NOUVEAU
│     │
│     └─ Locataire App (Self-contained)
│        ├─ App.tsx
│        ├─ Layout.tsx
│        └─ 10+ Composants métier
│
└─ Providers (Context, Toast, Router)
   ├─ QueryClientProvider
   ├─ TooltipProvider
   ├─ Toaster (UI)
   └─ BrowserRouter
```

---

## Optimisations possibles

### 1. Code Splitting

```typescript
// Avant
import LocataireApp from "./pages/Locataire/App";

// Après (lazy loading)
const LocataireApp = lazy(() => import("./pages/Locataire/App"));

<Route path="/app/locataire" element={
  <Suspense fallback={<Loading />}>
    <LocataireApp />
  </Suspense>
} />
```

### 2. State Management

```typescript
// Option 1: Redux (pour état global complexe)
// Option 2: Zustand (léger et simple)
// Option 3: Jotai (atoms basés)
// Option 4: Context API + useReducer (actuel)
```

### 3. Performance

```typescript
// Memoization des composants
const Dashboard = memo(DashboardComponent);

// Optimisation des sélecteurs
const usePayments = () => useMemo(() => paymentsList, [paymentsList]);

// Lazy rendering avec react-virtual
import { FixedSizeList } from 'react-window';
```

---

## Déploiement

### Environnement local

```
npm start / bun run dev
→ http://localhost:5173
```

### Staging

```
npm run build
→ Fichiers dans dist/
→ Déployer sur serveur de staging
```

### Production

```
npm run build
→ Optimisé et minifié
→ Servir avec Nginx/Apache
→ Ajouter CDN
→ Configurer caching headers
```

---

## Checklist d'intégration

- [x] Composant créé et fonctionnel
- [x] Intégration dans les routes
- [x] Build testée ✅
- [x] Linting validé ✅
- [x] Documentation complète
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] E2E tests
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] Security audit
- [ ] Déploiement production

---

## Ressources utiles

- React: https://react.dev
- React Router: https://reactrouter.com
- Vite: https://vitejs.dev
- Tailwind: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com
- Bun: https://bun.sh

---

## Support & Maintenance

Pour toute question ou amélioration :

1. Consulter LOCATAIRE_GUIDE.md
2. Vérifier START_LOCATAIRE.md
3. Lire ANALYSE_LOCATAIRE.md
4. Exécuter `bun run lint` pour vérifier les erreurs
5. Exécuter `bun run dev` pour tester localement

**Module Locataire : Prêt pour production ! 🚀**
