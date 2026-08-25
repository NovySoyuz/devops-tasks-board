# DevOps Tasks Board – Projet pédagogique CESI

Application web **3-tiers** (Frontend React + Backend Node.js + Base PostgreSQL) servant de support pédagogique aux pratiques DevOps / DevSecOps.

---

## Statut du projet

| Composant | Statut |
|---|---|
| Frontend React (Vite) | ✅ Opérationnel |
| Backend Node.js (Express) | ✅ Opérationnel |
| Base de données PostgreSQL | ✅ Opérationnel |
| Conteneurisation Docker | ✅ Opérationnel (`docker-compose`) |
| Déploiement Kubernetes (Minikube) | ✅ Opérationnel |
| Ingress Nginx | ✅ Opérationnel |
| Persistance BDD (PVC) | ✅ Opérationnel |
| Tests unitaires (Jest / Vitest) | ✅ Opérationnel |
| CI/CD (GitHub Actions) | ✅ Opérationnel |

---

## Architecture

```
Navigateur
    │
    ▼
Ingress Nginx (http://192.168.49.2)
    ├── /        → frontend-service:5173  (React + Vite dev server)
    └── /api/*   → backend-service:3000  (Express API — strip /api par rewrite)
                        │
                        ▼
                 postgres-service:5432  (PostgreSQL 15 + PVC 1Gi)
```

---

## Structure du projet

```
devops-tasks-board/
├── Makefile              # Commandes de déploiement (Docker & Kubernetes)
├── backend/              # API Node.js / Express
│   └── src/
│       ├── server.js
│       ├── db.js
│       └── __tests__/    # Tests Jest + Supertest
├── frontend/             # SPA React / Vite
│   └── src/
│       ├── App.jsx
│       └── __tests__/    # Tests Vitest + Testing Library
└── infra/
    ├── docker/           # docker-compose.yaml
    └── k8s/              # Manifests Kubernetes
        ├── config/       # ConfigMap & Secret
        ├── postgres/     # Deployment, Service, PVC, init.sql
        ├── backend/      # Deployment & Service
        ├── frontend/     # Deployment & Service
        └── ingress.yaml  # Ingress Nginx
```

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Make](https://www.gnu.org/software/make/) *(inclus sur Linux/macOS)*
- [Node.js 24+](https://nodejs.org/) *(optionnel, pour dev local)*

---

## Démarrage rapide avec Make

### Docker Compose *(dev local)*

```bash
# 1ère installation : build + démarrage + initialisation de la base de données
make init

# Démarrer / Arrêter
make up
make down

# Autres commandes utiles
make restart   # redémarrer les conteneurs
make build     # rebuilder les images Docker
make logs      # suivre les logs en temps réel
make ps        # statut des conteneurs
```

Accès : [http://localhost:5173](http://localhost:5173) (frontend) — [http://localhost:3000](http://localhost:3000) (backend)

### Kubernetes *(Minikube)*

```bash
# 1er déploiement complet
make k8s-init

# Mettre à jour les ressources
make k8s-up

# Vérifier l'état des pods
make k8s-status

# Tout supprimer
make k8s-down
```

> `make help` affiche la liste complète des commandes disponibles.

---

## Installation manuelle

### Option 1 — Docker Compose

```bash
cd infra/docker
docker compose up --build
```

```bash
docker compose stop    # arrêter sans supprimer
docker compose start   # relancer
docker compose down    # arrêter et supprimer les conteneurs
```

---

### Option 2 — Kubernetes avec Minikube

#### 1. Démarrer Minikube et activer l'Ingress

```bash
minikube start
minikube addons enable ingress

# Attendre que le contrôleur Ingress soit prêt (~1 min)
kubectl get pods -n ingress-nginx
```

#### 2. Construire les images Docker dans Minikube

```bash
# Pointer Docker vers le daemon Minikube
eval $(minikube docker-env)

# Builder les images
docker build -t tasks-backend:latest ./backend
docker build -t tasks-frontend:latest ./frontend
```

#### 3. Déployer les manifests Kubernetes

```bash
# ConfigMap & Secret
kubectl apply -f infra/k8s/config/

# Base de données
kubectl apply -f infra/k8s/postgres/

# Backend & Frontend
kubectl apply -f infra/k8s/backend/
kubectl apply -f infra/k8s/frontend/

# Ingress
kubectl apply -f infra/k8s/ingress.yaml
```

#### 4. Vérifier que tout tourne

```bash
kubectl get pods
# Attendre que tous les pods soient en STATUS Running
```

#### 5. Exposer l'Ingress sur la machine locale

```bash
# Dans un terminal dédié (laisser ouvert)
minikube tunnel
```

#### 6. Accéder à l'application

Ouvrir [http://192.168.49.2](http://192.168.49.2) dans le navigateur.

---

## Tests

```bash
# Backend (Jest + Supertest)
cd backend && npm test

# Frontend (Vitest + Testing Library)
cd frontend && npm test
```

La CI GitHub Actions exécute automatiquement lint + tests + build sur chaque push et Pull Request.

---

## Commandes utiles (kubectl)

```bash
# État des pods
kubectl get pods

# Logs d'un service
kubectl logs deployment/backend-deployment
kubectl logs deployment/postgres-deployment

# Redémarrer un déploiement
kubectl rollout restart deployment/backend-deployment

# Supprimer tout et repartir de zéro
kubectl delete -f infra/k8s/ingress.yaml
kubectl delete -f infra/k8s/frontend/
kubectl delete -f infra/k8s/backend/
kubectl delete -f infra/k8s/postgres/
kubectl delete -f infra/k8s/config/
```

---

## Points d'attention

- **Ingress splitté** : deux ressources Ingress distinctes (`ingress-api` avec rewrite, `ingress-frontend` sans) pour éviter la corruption du `Content-Type` des modules JS Vite.
- **VITE_API_URL** : le frontend appelle `/api` (chemin relatif). L'Ingress route vers le backend en supprimant le préfixe `/api`.
- **Init SQL** : le script `init.sql` n'est exécuté par PostgreSQL qu'au **premier démarrage** d'un volume vide. Si le volume existe déjà, l'exécuter manuellement via `kubectl exec`.

---

## Objectifs pédagogiques

- Conteneurisation avec Docker & Docker Compose
- Orchestration avec Kubernetes (Minikube)
- Exposition via Ingress Nginx avec réécriture de routes
- Persistance des données avec PersistentVolumeClaim (PVC)
- Automatisation du déploiement avec Make
- Tests unitaires et d'intégration (Jest, Vitest, Supertest)
- CI/CD avec GitHub Actions (lint → tests → build)