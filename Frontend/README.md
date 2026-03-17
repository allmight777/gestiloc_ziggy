# GestiLoc – Kit marketing & espace locataire "GestiLoc"

Ce dépôt contient une application front-end de démonstration pour la gestion locative :

- un site marketing (pages d’atterrissage, présentation, tarification, etc.) ;
- un **espace locataire** immersif appelé *GestiLoc*, qui simule l’interface d’un locataire dans un immeuble géré avec GestiLoc.

L’objectif est de disposer d’un support visuel réaliste pour des démonstrations commerciales, des tests UX et de la communication produit.

---

## 1. Cahier des charges fonctionnel

### 1.1. Espace locataire – Vue d’ensemble

**Objectif utilisateur** : permettre à un locataire de suivre sa situation locative (loyer, logement, documents, échanges…) depuis une interface moderne type "application bancaire".

**Modules fonctionnels principaux** :

1. **Tableau de bord locataire (`Locataire/Dashboard`)**
   - Affichage du statut du loyer du mois courant (montant, statut payé/à jour, date de paiement).
   - Visualisation de la prochaine échéance (date, montant, mode de paiement prévu).
   - Mise en avant des interventions en cours (ex. fuite, panne de chauffage) avec statut synthétique.
   - Raccourcis d’action :
     - bouton "Payer" (ouverture d’un flux de paiement simulé),
     - accès rapide aux documents (quittances, bail…),
     - accès aux détails du logement.
   - Expérience utilisateur type "néobanque" avec cartes, indicateurs, et skeleton loaders pour la simulation de chargement.

2. **Paiements & historique (`Locataire/Payments`)**
   - Vue synthétique des **indicateurs financiers** :
     - solde actuel (retard ou à jour),
     - dernier paiement (montant + date),
     - prochain loyer (montant + date).
   - **Graphique d’évolution des loyers** (Recharts) sur plusieurs mois.
   - **Tableau d’historique des transactions** :
     - mois, montant, statut (payé, en retard…),
     - date de paiement,
     - actions :
       - téléchargement de la quittance au format PDF (simulé),
       - envoi par e-mail (CTA sans back-end).
   - Action "Effectuer un virement" : simulation d’initiation d’un paiement (notification visuelle).

3. **Messagerie locataire ↔ propriétaire / agence (`Locataire/Messages`)**
   - Liste de **contacts** : propriétaire, agence, syndic, avec compteur de messages non lus.
   - Conversation type chat :
     - bulles alignées à gauche/droite selon l’émetteur (moi / propriétaire),
     - timestamps des messages,
     - état lu/non lu simulé.
   - Zone de saisie de message avec :
     - envoi texte (création d’un nouveau message côté front),
     - actions de pièces jointes / images (UI uniquement),
     - raccourci clavier *Enter* pour envoyer.
   - Notification "Message envoyé" via système de toasts.

4. **Déclaration d’interventions & suivi (`Locataire/Interventions`)**
   - Liste des interventions passées / en cours : titre, type (plomberie, chauffage…), statut (en cours/terminé), prestataire, date.
   - Formulaire de **déclaration d’incident** :
     - choix du type d’urgence (fuite, électricité, chauffage, autre),
     - description textuelle,
     - zone de dépôt de photos (drag & drop simulé),
     - sélection de créneaux de disponibilité (mock de calendrier horizonal).
   - Boutons d’action :
     - "Signaler un problème" → ouvre le formulaire,
     - "Envoyer la déclaration" → feedback de succès (toast) + fermeture du formulaire.

5. **Gestion des documents locatifs (`Locataire/Documents` + `DocumentViewer`)**
   - Catégorisation des documents :
     - Contrat de location (bail, avenants, règlement de copropriété…),
     - Quittances & finances,
     - Diagnostics techniques (DPE, électricité, etc.).
   - Pour chaque document :
     - nom, date, taille, éventuel tag (Important, Nouveau…),
     - actions :
       - **aperçu** (ouverture d’une modale de visualisation PDF simulée),
       - **téléchargement** (notification + CTA).
   - Champ de **recherche textuelle** (front uniquement, sans filtrage réel pour l’instant).
   - `DocumentViewer` :
     - affichage dans une modale pleine hauteur (mock de PDF ou image),
     - actions : télécharger, imprimer, partager (simulé).

6. **Fiche bail (`Locataire/Lease`)**
   - Récapitulatif du bail :
     - numéro de contrat, statut (signé électroniquement),
     - timeline visuelle (signature, entrée, prochaine échéance/renouvellement).
   - Bloc **conditions financières** :
     - loyer HC, provisions sur charges, total mensuel,
     - dépôt de garantie + statut (payé).
   - Bloc **informations complémentaires** :
     - durée du bail, date d’exigibilité du loyer, modalités de révision, règles de colocation, etc.
   - Action "Télécharger le PDF" (simulée via toast).

7. **Fiche logement & performances énergétiques (`Locataire/Property`)**
   - Hero visuel du bien (photo, adresse, étage, badge "Loué").
   - Caractéristiques principales : surface, typologie (T2), étage, hauteur sous plafond.
   - Équipements & services : fibre, chauffage, électricité, revêtements, etc.
   - Bloc **Performance énergétique (DPE / GES)** avec barres et classes (ex. Classe C).
   - CTA pour **télécharger le rapport DPE** (simulée via toast).
   - Carte "Gestionnaire" : nom de l’agence, contact, bouton "Contacter" (notification).

8. **Profil locataire & préférences (`Locataire/Profile`)**
   - Affichage du profil : avatar, nom, rôle (locataire principal), statut du dossier.
   - Formulaire modifiable :
     - e-mail,
     - téléphone.
   - Bloc "Sécurité & préférences" :
     - rappel sur le mot de passe (CTA "Modifier"),
     - préférence de notifications (toggle Email/SMS simulé).
   - Boutons globaux :
     - **Enregistrer les modifications** (simulation d’appel API + loader),
     - **Déconnexion** (réinitialise l’onglet actif côté front + toast).

9. **Navigation & layout (`Locataire/Layout`, `Locataire/App`)**
   - Menu latéral avec onglets : Accueil, Paiements, Messagerie, Interventions, Documents, Mon bail, Le bien, Profil.
   - Version responsive :
     - sidebar en drawer sur mobile,
     - header sticky avec titre de la section active.
   - **Centre de notifications** (icône cloche) :
     - notifications critiques (loyer en retard) et importantes (intervention planifiée),
     - popup avec liste scrollable.
   - **Système de toasts** global : feedback pour actions (paiement, téléchargement, incidents, etc.).

10. **Site marketing (pages publiques dans `src/pages`)**
    - Pages : Accueil, Tarifs, Démo, FAQ, Blog & article, Contact, CGU/CGV, Politique de confidentialité, etc.
    - Objectif : présenter la solution GestiLoc / GestiLoc et rediriger vers des démonstrations.

> **Remarque importante** : toutes les données sont actuellement **mockées côté front** (pas de connexion API ni base de données). Le but est une démo UX/UI, pas encore un produit en production.

---

## 2. Stack technique

- **React 18** + **TypeScript**.
- **Vite** pour le bundling et le dev server.
- **React Router DOM** pour la navigation multi-pages.
- **Tailwind CSS** + **tailwindcss-animate** pour le design et les animations.
- **shadcn/ui** & **Radix UI** pour les composants UI accessibles.
- **Lucide React** pour les icônes.
- **Recharts** pour les graphiques.
- **React Hook Form** + **Zod** (disponibles pour les formulaires et la validation).

---

## 3. Installation & démarrage

### Prérequis

- Node.js LTS (version recommandée ≥ 18).
- npm ou bun (le projet utilise un `bun.lockb` mais fonctionne aussi avec npm).

### Installation

```sh
npm install
```

### Lancer le serveur de développement

```sh
npm run dev
```

L’application sera disponible sur une URL locale de type `http://localhost:5173` (ou similaire selon Vite).

### Build de production

```sh
npm run build
```

### Lint

```sh
npm run lint
```

---

## 4. Structure du projet (simplifiée)

- `src/main.tsx` : point d’entrée React + routing.
- `src/App.tsx` : shell global de l’application.
- `src/pages/` : pages publiques (Home, Pricing, FAQ, Blog, etc.).
- `src/pages/Locataire/` : espace locataire *GestiLoc*.
  - `App.tsx` : gestion des onglets et du système de toasts.
  - `components/Layout.tsx` : navigation, sidebar, header, notifications.
  - `components/*.tsx` : modules fonctionnels (Dashboard, Payments, Messages, Interventions, Documents, Lease, Property, Profile…).
  - `types.ts` : types métier (paiements, messages, notifications, etc.).
- `src/components/ui/` : bibliothèque de composants UI (boutons, cartes, modales, formulaires, etc.).
- `tailwind.config.ts`, `postcss.config.js` : configuration Tailwind/PostCSS.
- `vite.config.ts` : configuration Vite.

---

## 5. Pistes d’évolutions

- Connexion à un **back-end réel** (API REST/GraphQL) pour : paiements, documents, messagerie, interventions.
- Authentification sécurisée (JWT, OAuth, SSO agence…).
- Gestion multi-rôles : locataire, propriétaire, gestionnaire, technicien.
- Internationalisation (FR / EN).
- Génération réelle de PDF (quittances, bail, attestations) côté serveur.
- Intégration de WebSockets ou long polling pour une messagerie en temps réel.

Ce README sert de base de cahier des charges fonctionnel et technique pour faire évoluer le prototype vers une application de gestion locative complète.
