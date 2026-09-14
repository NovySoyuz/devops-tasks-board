# DevOps Tasks Board

> Application web **3-tiers** de suivi de tâches DevOps / DevSecOps, déployée en continu sur Render avec CI/CD GitHub Actions, analyse de qualité SonarCloud et authentification Auth0.

[![CI](https://github.com/NovySoyuz/devops-tasks-board/actions/workflows/ci.yml/badge.svg)](https://github.com/NovySoyuz/devops-tasks-board/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NovySoyuz_devops-tasks-board&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NovySoyuz_devops-tasks-board)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=NovySoyuz_devops-tasks-board&metric=coverage)](https://sonarcloud.io/summary/new_code?id=NovySoyuz_devops-tasks-board)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=NovySoyuz_devops-tasks-board&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=NovySoyuz_devops-tasks-board)

---

## 🌐 Accès en ligne

| Environnement | URL |
|---|---|
| **Frontend (production)** | https://devops-tasks-front.onrender.com |
| **Backend API (production)** | https://devops-tasks-board-wdio.onrender.com |
| **Analyse SonarCloud** | https://sonarcloud.io/project/overview?id=NovySoyuz_devops-tasks-board |

---

## Stack technique

| Composant | Technologie |
|---|---|
| Frontend | React 19 + Vite 8 |
| Backend | Node.js + Express 5 |
| Base de données | PostgreSQL 15/18 |
| Authentification | Auth0 (JWT RS256) |
| Conteneurisation | Docker Compose |
| Orchestration | Kubernetes (Minikube) + Ingress Nginx |
| CI/CD | GitHub Actions |
| Qualité de code | SonarCloud (lint + coverage + security) |
| Hébergement | Render (frontend static + backend web service + PostgreSQL) |

---

## Architecture

```
Navigateur
    │
    ▼
Ingress Nginx (HTTPS)          ← K8s / Render
    ├── /              → frontend-service:5173   (React + Vite)
    └── /api/*         → backend-service:3000    (Express — strip /api)
                               │
                               ▼
                       postgres-service:5432     (PostgreSQL + PVC)
```

**Flux d'authentification :**
```
Navigateur → Auth0 (login) → JWT Access Token → Backend (vérification RS256)
```

---

## Pipeline CI/CD

```
git push
    │
    ▼
┌─────────────────────────────────────────────────┐
│  GitHub Actions                                  │
│                                                  │
│  lint (backend + frontend)                       │
│      └→ backend tests + coverage (Jest)          │
│              └→ frontend tests + coverage (Vitest│
│                      └→ SonarCloud analysis ☁️   │
└─────────────────────────────────────────────────┘
    │
    ▼ (branche main uniquement)
Render auto-deploy → frontend + backend en production
```

---

## Structure du projet

```
devops-tasks-board/
├── Makefile              # Commandes de déploiement (Docker + K8s)
├── sonar-project.properties  # Configuration SonarCloud
├── backend/              # API Node.js / Express
│   ├── src/
│   │   ├── server.js     # Point d'entrée + routes
│   │   ├── db.js         # Pool PostgreSQL
│   │   ├── middleware/auth.js  # Validation JWT Auth0
│   │   └── __tests__/    # Tests Jest + Supertest
│   └── Dockerfile
├── frontend/             # SPA React / Vite
│   ├── src/
│   │   ├── main.jsx      # Auth0Provider
│   │   ├── App.jsx       # Kanban board
│   │   └── __tests__/    # Tests Vitest + Testing Library
│   └── Dockerfile
└── infra/
    ├── docker/           # docker-compose.yaml + .env.example
    └── k8s/              # Manifests Kubernetes
        ├── config/       # ConfigMap & Secret (placeholder)
        ├── postgres/     # Deployment, Service, PVC, init.sql
        ├── backend/      # Deployment & Service
        ├── frontend/     # Deployment & Service
        └── ingress.yaml  # Ingress Nginx (API + Frontend)
```

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) + [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Make](https://www.gnu.org/software/make/)

---

## Démarrage avec Docker *(dev local)*

```bash
# Créer le fichier de variables d'environnement
cp infra/docker/.env.example infra/docker/.env
# Éditer infra/docker/.env et définir POSTGRES_PASSWORD

make init    # 1ère fois : build + démarrage + init BDD
make up      # démarrer (ou rebuilder si code modifié)
make down    # arrêter
make logs    # suivre les logs
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

---

## Démarrage avec Kubernetes *(Minikube)*

#### 1. Préparer Minikube

```bash
minikube start
minikube addons enable ingress

# Builder les images dans le daemon Minikube
eval $(minikube docker-env)
docker build -t tasks-backend:latest ./backend
docker build -t tasks-frontend:latest ./frontend
```

#### 2. Déployer

```bash
make k8s-init     # crée les secrets + applique tous les manifests + génère le cert TLS
make k8s-status   # vérifier que les pods sont Running
```

#### 3. Accéder

```bash
minikube ip       # ex : 192.168.49.2
```

| Service | URL |
|---|---|
| Application | https://\<minikube-ip\> *(accepter l'alerte certificat auto-signé)* |

#### Commandes utiles

```bash
make k8s-secrets  # mettre à jour les secrets K8s uniquement
make k8s-deploy   # rebuilder les images et relancer les pods
make k8s-down     # tout supprimer
make k8s-status   # état des pods / services / ingress
```

> **Note sécurité :** les mots de passe ne sont jamais commités. `make k8s-init` les injecte directement dans le cluster via `kubectl create secret`.

---

## Tests

```bash
cd backend  && npm test             # Jest + Supertest (15 tests)
cd frontend && npm test             # Vitest + Testing Library
cd backend  && npm test -- --coverage   # avec rapport de couverture
```

La CI GitHub Actions exécute **lint → tests → coverage → SonarCloud** sur chaque push et Pull Request vers `main` et `develop`.

---

## Gestion des évolutions & ticketing

- **Templates GitHub Issues** (`.github/ISSUE_TEMPLATE/`) : formulaires dédiés *bug report* et *feature request* pour cadrer les demandes (contexte, criticité/priorité, critères d'acceptation).
- **Template de Pull Request** (`.github/PULL_REQUEST_TEMPLATE.md`) : checklist qualité (tests, lint, doc, sécurité) et lien systématique vers le ticket associé.
- **Veille technologique** : **Dependabot** (`.github/dependabot.yml`) surveille chaque semaine les dépendances npm (backend/frontend) et les actions GitHub utilisées en CI, et ouvre automatiquement une PR en cas de mise à jour ou de faille connue.

---

## Sécurité

- **Authentification** : Auth0 (OIDC / OAuth2) — JWT RS256 validé côté backend
- **Headers HTTP** : `helmet` (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** : origines autorisées configurées via variable d'environnement
- **Rate limiting** : `express-rate-limit` (100 req / 15 min / IP) contre le brute-force et le DDoS
- **Validation des payloads** : schémas `zod` sur les routes de création (remplace les vérifs manuelles), rejette toute donnée mal typée ou hors valeurs autorisées
- **Secrets** : aucune valeur sensible commitée — variables d'environnement sur Render, `kubectl create secret` pour K8s
- **Images Docker** : build multi-stage, utilisateur non-root (`USER node`), CLI `npm` retiré de l'image finale (moins de surface d'attaque, exécution via `node` direct), paquets système Alpine à jour (`apk upgrade`), scan de vulnérabilités **Trivy** en CI (bloque sur faille HIGH/CRITICAL)
- **Dépendances** : **Dependabot** (veille hebdomadaire) + `npm audit --audit-level=high` en CI
- **Analyse statique** : SonarCloud sur chaque push (bugs, vulnérabilités, code smells)
- **Signalement de faille** : procédure documentée dans [`SECURITY.md`](./SECURITY.md)

---

## Modération

Un onglet **🛠️ Modération** apparaît dans l'interface uniquement pour les utilisateurs ayant le rôle `moderator`. Il permet :

- **Gestion des utilisateurs** : liste des comptes (nom, email, rôle, statut, dernière connexion) avec un bouton **Bannir**. ⚠️ Il ne s'agit **pas** d'une suppression du compte Auth0 : le compte reste utilisable pour se connecter, mais l'utilisateur banni (`banned = true` en base) se voit refuser l'accès à l'API (403) dès sa prochaine requête. C'est un choix volontaire et plus simple qu'une suppression réelle via l'API de Management Auth0.
- **Modération du contenu** : création, modification et suppression des projets (`POST/PUT/DELETE /projects`), en plus de la suppression de tâches déjà existante.

Côté backend, ces routes sont protégées par le middleware `requireModerator`, qui s'appuie sur le rôle transmis par Auth0 dans le token (voir ci-dessous) et synchronisé dans la table `users` à chaque requête authentifiée (`loadUser`).

### Comment attribuer le rôle `moderator` à un utilisateur (Auth0)

Le rôle n'est pas géré uniquement en base locale : il provient d'un **rôle Auth0**, injecté dans le token via une **Action**, pour rester la source de vérité même si la base est réinitialisée.

1. **Créer le rôle** : Auth0 Dashboard → *User Management* → *Roles* → *Create Role* → nom `moderator`.
2. **Assigner le rôle** : *User Management* → *Users* → sélectionner l'utilisateur → onglet *Roles* → *Assign Roles* → `moderator`.
3. **Créer une Action Post-Login** qui ajoute les rôles au token : Auth0 Dashboard → *Actions* → *Flows* → *Login* → *Add Action* → *Build Custom* :

   ```js
   exports.onExecutePostLogin = async (event, api) => {
     const namespace = "https://devops-tasks-api"; // doit correspondre à AUTH0_AUDIENCE / VITE_AUTH0_AUDIENCE
     if (event.authorization) {
       api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
       api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
     }
   };
   ```

   Déployer l'Action puis la glisser dans le flow **Login** (elle doit apparaître entre *Start* et *Complete*).
4. **Se reconnecter** : le nouveau token contient alors `https://devops-tasks-api/roles: ["moderator"]`, lu côté frontend (`user[ROLES_CLAIM]`) pour afficher l'onglet, et côté backend (middleware `auth.js` / `loadUser.js`) pour synchroniser le rôle en base et autoriser les routes de modération.

---

## Notes

- **HTTPS en K8s** : le cert auto-signé est généré automatiquement par `make k8s-init`. Accepter l'alerte de sécurité du navigateur.
- **Init SQL** : le script `init.sql` n'est exécuté par PostgreSQL qu'au premier démarrage d'un volume vide.
- **Ingress splitté** : deux ressources Ingress distinctes pour éviter les conflits de rewrite entre l'API et le frontend.
