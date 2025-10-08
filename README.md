# Study-University

**Study-University** est une application mobile multi-plateforme (Android, iOS et web) développée avec **Expo** et **React Native**, visant à centraliser les ressources d’étude, la gestion des cours et le suivi universitaire.
Ce projet est pensé pour être **modulaire, maintenable et évolutif**, avec une intégration backend via **Supabase**.

---

## 🗂 Sommaire

* [Description](#description)
* [Fonctionnalités](#fonctionnalités)
* [Technologies & Structure](#technologies--structure)
* [Prérequis](#prérequis)
* [Installation & Développement](#installation--développement)
* [Lancer l'application](#lancer-lapplication)
* [Base de données / Supabase](#base-de-donn%C3%A9es--supabase)
* [Build & Publication](#build--publication)
* [Tests](#tests)
* [Contribuer](#contribuer)
* [Licence](#licence)
* [Contact](#contact)

---

## 📄 Description

Study-University est conçu pour fournir aux étudiants une interface simple et intuitive pour :

* Consulter leurs cours et notes.
* Gérer et organiser leur emploi du temps.
* Accéder à des ressources d’étude et documents pédagogiques.
* Interagir avec un backend Supabase pour la gestion des données.

Le projet est pensé pour être facilement extensible et adaptable aux besoins universitaires.

---

## ⚡ Fonctionnalités

* Navigation multi-pages avec **Expo Router**.
* Composants réutilisables dans `components/`.
* Intégration backend via **Supabase** (`supabase/functions/` et `supabase_schema.sql`).
* Gestion de types avec TypeScript pour un code robuste et maintenable.
* Système de constantes et configuration centralisée pour une évolution facile du projet.

---

## 🛠 Technologies & Structure

* **Frontend :** Expo (React Native)
* **Langages :** TypeScript / JavaScript
* **Backend :** Supabase (SQL + Functions)

**Structure principale :**

```
Study-University/
├─ app/               # Pages et routage
├─ components/        # Composants réutilisables
├─ supabase/          # Fonctions et schéma SQL
├─ types/             # Typages TypeScript
├─ assets/            # Images et médias
├─ package.json       # Dépendances frontend
├─ tsconfig.json      # Configuration TypeScript
└─ README.md
```

---

## ⚙️ Prérequis

* Node.js >= 18
* npm ou yarn
* Expo CLI
* Accès à un projet **Supabase** (optionnel pour backend)

---

## 💻 Installation & Développement

```bash
# Cloner le projet
git clone https://github.com/ginfreecss46/Study-University.git
cd Study-University

# Installer les dépendances
npm install
# ou
yarn install

# Lancer Expo
npm start
# ou
yarn start
```

---

## 🚀 Lancer l'application

* Avec Expo Go sur mobile (scanner QR code).
* Sur émulateur Android/iOS via `npm run android` / `npm run ios`.
* Sur navigateur (web) via `npm run web`.

---

## 🗄 Base de données / Supabase

* Le dossier `supabase/` contient :

  * `supabase_schema.sql` → structure de tables et relations.
  * `functions/` → fonctions serverless pour la logique backend.

* Pour connecter :

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Ajoute-les dans un fichier `.env` à la racine.

---

## 📦 Build & Publication

* Créer un build pour production :

```bash
expo build:android
expo build:ios
```

* Ou utiliser EAS Build pour des builds plus avancés.

---

## 🧪 Tests

* Tests unitaires avec Jest (si configuré).
* Vérification des composants React Native dans `app/` via Expo Preview.

---

## 🤝 Contribuer

1. Fork le projet.
2. Crée ta branche feature : `git checkout -b feature/nom-feature`.
3. Commit tes changements : `git commit -m "Ajout feature ..."`.
4. Push sur ta branche : `git push origin feature/nom-feature`.
5. Ouvre une Pull Request.

---

## 📄 Licence

Ce projet est sous licence **MIT** — voir le fichier `LICENSE`.

---

## ✉️ Contact

* GitHub : [ginfreecss46](https://github.com/ginfreecss46)
* Projet : Study-University

---

*README généré et formaté automatiquement — adapte les sections (Supabase URL, scripts npm, tests) selon ta configuration réelle.*
