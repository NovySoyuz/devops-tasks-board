# ==============================================================
# Makefile — DevOps Tasks Board
# Usage : make <cible>   |   make help pour la liste complète
# ==============================================================

COMPOSE_FILE = infra/docker/docker-compose.yaml
K8S_DIR      = infra/k8s
INIT_SQL     = infra/k8s/postgres/init.sql

.PHONY: help init up down restart build deploy logs ps \
        k8s-init k8s-up k8s-down k8s-status k8s-deploy

# ── Aide ────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  DevOps Tasks Board — commandes disponibles"
	@echo ""
	@echo "  Docker Compose (dev local) :"
	@echo "    make init       → 1ère installation : build + démarrage + init BDD"
	@echo "    make up         → démarrer les conteneurs"
	@echo "    make down       → arrêter et supprimer les conteneurs"
	@echo "    make restart    → redémarrer les conteneurs"
	@echo "    make build      → rebuilder les images Docker"
	@echo "    make deploy     → rebuilder et relancer sans toucher à la BDD"
	@echo "    make logs       → suivre les logs en temps réel"
	@echo "    make ps         → statut des conteneurs"
	@echo ""
	@echo "  Kubernetes :"
	@echo "    make k8s-init   → 1er déploiement (applique tous les manifests)"
	@echo "    make k8s-up     → appliquer les manifests k8s"
	@echo "    make k8s-deploy → rebuilder les images et redémarrer les pods"
	@echo "    make k8s-down   → supprimer toutes les ressources k8s"
	@echo "    make k8s-status → afficher l'état des pods / services"
	@echo ""

# ── Docker Compose ──────────────────────────────────────────────────────────

# Première installation : build, démarrage et initialisation de la base de données
init:
	@echo "🚀 Initialisation du projet..."
	docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "⏳ Attente du démarrage de PostgreSQL (10s)..."
	@sleep 10
	@echo "📦 Initialisation de la base de données..."
	docker exec -i devops_tasks_db psql -U devops -d tasksdb < $(INIT_SQL)
	@echo ""
	@echo "✅ Projet prêt :"
	@echo "   → Frontend : http://localhost:5173"
	@echo "   → Backend  : http://localhost:3000"

# Démarrer les conteneurs existants
up:
	docker compose -f $(COMPOSE_FILE) up -d

# Arrêter et supprimer les conteneurs (les volumes sont conservés)
down:
	docker compose -f $(COMPOSE_FILE) down

restart:
	docker compose -f $(COMPOSE_FILE) restart
# Rebuilder les images sans redémarrer
build:
	docker compose -f $(COMPOSE_FILE) build

# Rebuilder et relancer sans toucher à la BDD
deploy:
	docker compose -f $(COMPOSE_FILE) up -d --build

# Suivre les logs de tous les services
logs:
	docker compose -f $(COMPOSE_FILE) logs -f

# Afficher le statut des conteneurs
ps:
	docker compose -f $(COMPOSE_FILE) ps

# ── Kubernetes ──────────────────────────────────────────────────────────────

# Premier déploiement : applique les manifests dans le bon ordre
k8s-init:
	@echo "🚀 Déploiement initial sur Kubernetes..."
	kubectl apply -f $(K8S_DIR)/config/
	kubectl apply -f $(K8S_DIR)/postgres/
	kubectl apply -f $(K8S_DIR)/backend/
	kubectl apply -f $(K8S_DIR)/frontend/
	kubectl apply -f $(K8S_DIR)/ingress.yaml
	@echo "✅ Déploiement terminé — vérifiez avec : make k8s-status"

# Mettre à jour les ressources k8s (applique les changements)
k8s-up:
	kubectl apply -f $(K8S_DIR)/config/
	kubectl apply -f $(K8S_DIR)/postgres/
	kubectl apply -f $(K8S_DIR)/backend/
	kubectl apply -f $(K8S_DIR)/frontend/
	kubectl apply -f $(K8S_DIR)/ingress.yaml

# Supprimer toutes les ressources k8s
k8s-down:
	kubectl delete -f $(K8S_DIR)/ingress.yaml --ignore-not-found
	kubectl delete -f $(K8S_DIR)/frontend/ --ignore-not-found
	kubectl delete -f $(K8S_DIR)/backend/ --ignore-not-found
	kubectl delete -f $(K8S_DIR)/postgres/ --ignore-not-found
	kubectl delete -f $(K8S_DIR)/config/ --ignore-not-found

# Afficher l'état des pods, services et ingress
k8s-status:
	kubectl get pods,services,ingress

# Rebuilder les images directement dans le daemon Docker de minikube, puis redémarrer les pods
k8s-deploy:
	@echo "🔨 Build des images dans le daemon Docker de minikube..."
	eval $$(minikube docker-env) && \
		docker build -t tasks-frontend:latest ./frontend && \
		docker build -t tasks-backend:latest ./backend
	@echo "♻️  Redémarrage des pods..."
	kubectl rollout restart deployment/frontend-deployment
	kubectl rollout restart deployment/backend-deployment
	@echo "✅ Déploiement terminé — vérifiez avec : make k8s-status"
