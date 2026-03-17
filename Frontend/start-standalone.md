# Démarrage de GestiLoc (Frontend Standalone)

## Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn

## Installation des dépendances
```bash
cd Frontend
npm install
```

## Démarrage de l'application
```bash
npm run dev
```

L'application sera accessible à l'adresse : http://localhost:5173

## Fonctionnalités disponibles

### ✅ Tableau de bord locataire
- Statistiques des locations
- Actions rapides
- Notifications intégrées

### ✅ Pages accessibles
- **Tableau de bord** : Vue d'ensemble
- **Aide** : Centre d'aide avec FAQ
- **Mon propriétaire** : Informations de contact
- **Ma location** : Détails du bail
- **Mes quittances** : Historique des paiements
- **Documents** : Gestion des documents
- **Mes interventions** : Signalements et maintenance
- **Mes tâches** : Todo list
- **Mes notes** : Notes personnelles
- **Préavis** : Gestion des préavis
- **Paiements** : Simulation de paiements
- **Paramètres** : Configuration du profil

### ✅ Données mockées
- Utilisateur : Jean Dupont (locataire@exemple.com)
- Bail : Appartement T3 Paris 11ème
- Propriétaire : Gestion Immobilière ProLog
- Quittances, factures, incidents, etc.

## Architecture
- **Frontend** : React + TypeScript + TailwindCSS
- **Données** : Services mockés (pas de backend requis)
- **Routing** : React Router
- **UI** : Composants modernes avec animations

## Note
Cette version utilise des données simulées et ne nécessite pas de backend Laravel. Toutes les fonctionnalités sont entièrement fonctionnelles avec des données de démonstration.
