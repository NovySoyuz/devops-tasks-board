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
cd backend  && npm test             # Jest + Supertest (6 tests)
cd frontend && npm test             # Vitest + Testing Library
cd backend  && npm test -- --coverage   # avec rapport de couverture
```

La CI GitHub Actions exécute **lint → tests → coverage → SonarCloud** sur chaque push et Pull Request vers `main` et `develop`.

---

## Sécurité

- **Authentification** : Auth0 (OIDC / OAuth2) — JWT RS256 validé côté backend
- **Headers HTTP** : `helmet` (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** : origines autorisées configurées via variable d'environnement
- **Secrets** : aucune valeur sensible commitée — variables d'environnement sur Render, `kubectl create secret` pour K8s
- **Images Docker** : utilisateur non-root (`USER node`), `npm ci --ignore-scripts`
- **Analyse statique** : SonarCloud sur chaque push (bugs, vulnérabilités, code smells)

---

## Notes

- **HTTPS en K8s** : le cert auto-signé est généré automatiquement par `make k8s-init`. Accepter l'alerte de sécurité du navigateur.
- **Init SQL** : le script `init.sql` n'est exécuté par PostgreSQL qu'au premier démarrage d'un volume vide.
- **Ingress splitté** : deux ressources Ingress distinctes pour éviter les conflits de rewrite entre l'API et le frontend.
