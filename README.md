# DevOps Tasks Board – Projet pédagogique CESI

Application web **3-tiers** (Frontend React + Backend Node.js + Base PostgreSQL) servant de support pédagogique aux pratiques DevOps / DevSecOps.

---

## Statut du projet

| Composant | Statut |
|---|---|
| Frontend React (Vite) | ✅ Opérationnel |
| Backend Node.js (Express) | ✅ Opérationnel |
| Base de données PostgreSQL | ✅ Opérationnel (données non persistantes — `emptyDir`) |
| Conteneurisation Docker | ✅ Opérationnel (`docker-compose`) |
| Déploiement Kubernetes (Minikube) | ✅ Opérationnel |
| Ingress Nginx | ✅ Opérationnel |
| CI/CD | 🔜 À venir |
| Persistance BDD (PVC) | 🔜 À venir |

---

## Architecture

```
Navigateur
    │
    ▼
Ingress Nginx (http://192.168.49.2)
    ├── /        → frontend-service:5173  (React + Vite dev server)
    └── /api/*   → backend-service:3000  (Express API — /api strip par rewrite)
                        │
                        ▼
                 postgres-service:5432  (PostgreSQL 15)
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
        ├── postgres/     # Deployment + Service PostgreSQL
        ├── backend/      # Deployment + Service Backend
        ├── frontend/     # Deployment + Service Frontend
        └── ingress.yaml  # Ingress Nginx (2 ressources)
```

---

## Démarrage rapide

### Docker Compose

```bash
cd infra/docker
docker compose up --build     # premier lancement
docker compose stop           # arrêter sans supprimer les containers
docker compose start          # relancer
docker compose down           # arrêter et supprimer les containers
```

### Kubernetes (Minikube)

```bash
# Prérequis : minikube démarré + addon ingress activé
minikube addons enable ingress

# Déploiement complet
cd infra/k8s
kubectl apply -f config/
kubectl apply -f postgres/
kubectl apply -f backend/
kubectl apply -f frontend/
kubectl apply -f ingress.yaml

# Exposer l'ingress sur la machine locale
minikube tunnel

# Accès : http://192.168.49.2
```

---

## Points d'attention

- **Persistance BDD** : le volume PostgreSQL utilise `emptyDir` → les données sont perdues au redémarrage du pod. Un `PersistentVolumeClaim` est prévu pour la prochaine étape.
- **VITE_API_URL** : le frontend appelle `/api` (chemin relatif). L'Ingress se charge du routage vers le backend.
- **Ingress splitté** : deux ressources Ingress distinctes (`ingress-api` avec rewrite, `ingress-frontend` sans) pour éviter la corruption du `Content-Type` des modules JS.

---

## Objectifs pédagogiques

- Conteneurisation avec Docker & Docker Compose
- Orchestration avec Kubernetes (Minikube)
- Exposition via Ingress Nginx avec réécriture de routes
- CI/CD (à venir)
- Déploiement cloud sur Render (à venir)
- Persistance des données avec PVC (à venir)