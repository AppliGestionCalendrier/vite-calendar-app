# vite-calendar-app

Une application de gestion de calendrier développée avec React et TypeScript.

## Démo en ligne

Vous pouvez consulter la version en ligne de l'application à l'adresse suivante :
[https://vite-calendar-app-seven.vercel.app/](https://vite-calendar-app-seven.vercel.app/)

## Participants au projet

- Clément ROLLIN
- Alexandre BERNARDINI
- Benjamin GLEITZ
- Anthony MINI

## Description

Cette application de gestion de calendrier permet aux utilisateurs de créer, visualiser, modifier et supprimer des événements dans un calendrier interactif. Elle est construite avec des technologies modernes et offre une interface utilisateur intuitive.

## Technologies utilisées

- [React](https://reactjs.org/) - Bibliothèque JavaScript pour la création d'interfaces utilisateur
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript typé
- [CSS](https://developer.mozilla.org/fr/docs/Web/CSS) - Pour le style de l'application
- [Vercel](https://vercel.com/) - Plateforme de déploiement

## Fonctionnalités

- Affichage du calendrier en différentes vues
- Création, modification et suppression d'événements
- Interface responsive adaptée à différents appareils
- Composants réutilisables

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/AppliGestionCalendrier/vite-calendar-app.git

# Accéder au répertoire
cd vite-calendar-app

# Installer les dépendances
npm install
```

## Développement

```bash
# Lancer le serveur de développement
npm run dev
```

## Build pour la production

```bash
# Générer les fichiers de production
npm run build

# Démarrer le serveur (utilisant server.ts)
npm run start
```

## Déploiement

L'application est déployée sur Vercel. Pour déployer votre propre version :

1. Créez un compte sur [Vercel](https://vercel.com/)
2. Liez votre dépôt GitHub à Vercel
3. Configurez les paramètres de déploiement
4. Déployez l'application

## Structure du projet

```
AppliGestionCalendrier/
├── .idea/               # Fichiers de configuration IntelliJ
├── node_modules/        # Dépendances du projet
├── public/              # Fichiers statiques
├── src/                 # Code source
│   ├── components/      # Composants React réutilisables
│   ├── css/             # Fichiers de style CSS
│   ├── pages/           # Pages de l'application
│   ├── services/        # Services (API, etc.)
│   ├── App.css          # Styles pour le composant App
│   ├── App.tsx          # Composant principal
│   ├── index.css        # Styles globaux
│   ├── index.tsx        # Point d'entrée
│   ├── logo.svg         # Logo de l'application
│   ├── reportWebVitals.ts # Mesure de performances
│   └── server.ts        # Serveur Node.js
├── .gitignore           # Fichiers à ignorer par Git
├── package.json         # Dépendances et scripts
├── package-lock.json    # Versions précises des dépendances
├── README.md            # Documentation du projet
└── tsconfig.json        # Configuration TypeScript
```

## Démarrage rapide

1. Clonez le dépôt
2. Installez les dépendances avec `npm install`
3. Lancez l'application en mode développement avec `npm run dev`

## Licence

Ce projet est sous licence MIT.
