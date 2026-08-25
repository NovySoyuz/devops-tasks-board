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
| CI/CD | 🔜 À venir |

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
├── backend/              # API Node.js / Express
├── frontend/             # SPA React / Vite
└── infra/
    ├── docker/           # docker-compose.yaml
    └── k8s/              # Manifests Kubernetes
        ├── config/       # ConfigMap & Secret
        ├── postgres/     # Deployment, Service, PVC, init.sql
        ├── backend/      # Deployment & Service
        ├── frontend/     # Deployment & Service
        └── ingress.yaml  # Ingress Nginx (2 ressources séparées)
```

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Node.js 22+](https://nodejs.org/) *(optionnel, pour dev local)*

---

## Installation et démarrage

### Option 1 — Docker Compose *(dev local rapide)*

```bash
cd infra/docker
docker compose up --build
```

Accès : [http://localhost:5173](http://localhost:5173)

```bash
docker compose stop    # arrêter sans supprimer
docker compose start   # relancer
docker compose down    # arrêter et supprimer les containers
```

---

### Option 2 — Kubernetes avec Minikube *(recommandée)*

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
cd infra/k8s

# ConfigMap & Secret
kubectl apply -f config/

# Base de données
kubectl apply -f postgres/

# Initialiser le schéma SQL (à faire une seule fois)
kubectl exec -it deployment/postgres-deployment -- \
  psql -U devops -d tasksdb -f /docker-entrypoint-initdb.d/init.sql

# Backend & Frontend
kubectl apply -f backend/
kubectl apply -f frontend/

# Ingress
kubectl apply -f ingress.yaml
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

## Commandes utiles

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
- CI/CD *(à venir)*
- Déploiement cloud sur Render *(à venir)*