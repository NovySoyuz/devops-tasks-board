# DevOps Tasks Board – Projet pédagogique CESI

Application web **3-tiers** (Frontend React + Backend Node.js + PostgreSQL) avec authentification Keycloak, servant de support aux pratiques DevOps / DevSecOps.

---

## Stack

| Composant | Technologie |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Base de données | PostgreSQL 15 |
| Authentification | Keycloak 26 |
| Conteneurisation | Docker Compose |
| Orchestration | Kubernetes (Minikube) + Ingress Nginx |
| CI/CD | GitHub Actions |

---

## Architecture

```
Navigateur
    │
    ▼
Ingress Nginx (HTTPS)
    ├── /              → frontend-service:5173  (React + Vite)
    ├── /api/*         → backend-service:3000   (Express — strip /api)
    ├── /realms, /admin, /resources, /js
    │                  → keycloak-service:8080  (Keycloak 26)
    │
    └── backend-service → postgres-service:5432 (PostgreSQL + PVC)
```

---

## Structure du projet

```
devops-tasks-board/
├── Makefile              # Commandes de déploiement
├── backend/              # API Node.js / Express
├── frontend/             # SPA React / Vite
└── infra/
    ├── docker/           # docker-compose.yaml
    └── k8s/              # Manifests Kubernetes
        ├── config/       # ConfigMap & Secret
        ├── postgres/     # Deployment, Service, PVC, init.sql
        ├── keycloak/     # Deployment, Service, PVC
        ├── backend/      # Deployment & Service
        ├── frontend/     # Deployment & Service
        └── ingress.yaml  # Ingress Nginx (3 ressources)
```

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) + [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Make](https://www.gnu.org/software/make/)

---

## Démarrage avec Docker *(dev local)*

```bash
make init    # 1ère fois : build + démarrage + init BDD
make up      # démarrer (ou rebuilder si code modifié)
make down    # arrêter
make logs    # suivre les logs
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Keycloak admin | http://localhost:8080 (admin / admin) |

> **Config Keycloak (une seule fois) :** créer le realm `devops-tasks`, le client public `devops-tasks-frontend` (redirect URI : `http://localhost:5173/*`, web origin : `http://localhost:5173`), et un utilisateur de test.

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
make k8s-init     # applique tous les manifests + génère le cert TLS
make k8s-status   # vérifier que les pods sont Running
```

#### 3. Accéder

```bash
minikube ip       # ex : 192.168.49.2
```

| Service | URL |
|---|---|
| Application | https://\<minikube-ip\> *(accepter l'alerte certificat)* |
| Keycloak admin | https://\<minikube-ip\>/admin (admin / admin) |

> **Config Keycloak (une seule fois) :** créer le realm `devops-tasks`, le client public `devops-tasks-frontend` (redirect URI : `https://<minikube-ip>/*`, web origin : `https://<minikube-ip>`), et un utilisateur de test.

#### Commandes utiles

```bash
make k8s-deploy   # rebuilder les images et relancer les pods
make k8s-down     # tout supprimer
make k8s-status   # état des pods / services / ingress
```

---

## Tests

```bash
cd backend  && npm test   # Jest + Supertest
cd frontend && npm test   # Vitest + Testing Library
```

La CI GitHub Actions exécute lint + tests + build sur chaque push et Pull Request.

---

## Notes

- **HTTPS obligatoire en K8s** : Keycloak 26 requiert un contexte sécurisé (HTTPS) quand il est accédé via une IP. Le cert auto-signé est généré automatiquement par `make k8s-init`.
- **Init SQL** : le script `init.sql` n'est exécuté par PostgreSQL qu'au premier démarrage d'un volume vide.
- **Ingress splitté** : trois ressources Ingress distinctes pour éviter les conflits de rewrite entre l'API, Keycloak et le frontend.
