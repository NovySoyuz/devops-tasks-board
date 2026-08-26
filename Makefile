# ==============================================================
# Makefile — DevOps Tasks Board
# ==============================================================

COMPOSE_FILE = infra/docker/docker-compose.yaml
K8S_DIR      = infra/k8s
INIT_SQL     = infra/k8s/postgres/init.sql
MINIKUBE_IP  := $(shell minikube ip 2>/dev/null || echo "localhost")

.PHONY: help init up down logs k8s-init k8s-down k8s-deploy k8s-status _k8s-tls

help:
	@echo ""
	@echo "  Docker (dev local)"
	@echo "    make init          → 1ère installation : build + start + init BDD"
	@echo "    make up            → démarrer (rebuild si nécessaire)"
	@echo "    make down          → arrêter"
	@echo "    make logs          → suivre les logs"
	@echo ""
	@echo "  Kubernetes (minikube)"
	@echo "    make k8s-init      → déployer tout le cluster (idempotent)"
	@echo "    make k8s-deploy    → rebuilder les images et relancer les pods"
	@echo "    make k8s-down      → supprimer toutes les ressources"
	@echo "    make k8s-status    → état des pods / services / ingress"
	@echo ""
	@echo "  URLs Docker  →  http://localhost:5173  |  Keycloak: http://localhost:8080"
	@echo "  URLs K8s     →  https://$(MINIKUBE_IP)  |  Admin KC: https://$(MINIKUBE_IP)/admin"
	@echo ""

# ── Docker ──────────────────────────────────────────────────────────────────

init:
	docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "⏳ Attente de PostgreSQL..."
	@sleep 10
	docker exec -i devops_tasks_db psql -U devops -d tasksdb < $(INIT_SQL)
	@echo "✅  http://localhost:5173  |  Keycloak: http://localhost:8080 (admin/admin)"

up:
	docker compose -f $(COMPOSE_FILE) up -d --build

down:
	docker compose -f $(COMPOSE_FILE) down

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

# ── Kubernetes ───────────────────────────────────────────────────────────────

k8s-init:
	kubectl create configmap postgres-initdb-config \
		--from-file=init.sql=$(INIT_SQL) \
		--dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -f $(K8S_DIR)/config/
	kubectl apply -f $(K8S_DIR)/postgres/
	kubectl apply -f $(K8S_DIR)/keycloak/
	kubectl apply -f $(K8S_DIR)/backend/
	kubectl apply -f $(K8S_DIR)/frontend/
	kubectl apply -f $(K8S_DIR)/ingress.yaml
	@$(MAKE) _k8s-tls

k8s-deploy:
	eval $$(minikube docker-env) && \
		docker build -t tasks-frontend:latest ./frontend && \
		docker build -t tasks-backend:latest ./backend
	kubectl rollout restart deployment/frontend-deployment deployment/backend-deployment
	@echo "✅ Pods redémarrés — make k8s-status pour vérifier"

k8s-down:
	kubectl delete -f $(K8S_DIR)/ingress.yaml --ignore-not-found
	kubectl delete -f $(K8S_DIR)/frontend/ --ignore-not-found
	kubectl delete -f $(K8S_DIR)/backend/ --ignore-not-found
	kubectl delete -f $(K8S_DIR)/keycloak/ --ignore-not-found
	kubectl delete -f $(K8S_DIR)/postgres/ --ignore-not-found
	kubectl delete -f $(K8S_DIR)/config/ --ignore-not-found
	kubectl delete configmap postgres-initdb-config --ignore-not-found
	kubectl delete secret devops-tasks-tls --ignore-not-found

k8s-status:
	kubectl get pods,services,ingress

# Génère le cert TLS auto-signé et injecte les URLs HTTPS dans les pods.
# Appelé automatiquement par k8s-init — pas besoin de le lancer manuellement.
_k8s-tls:
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout /tmp/devops-tasks-tls.key \
		-out /tmp/devops-tasks-tls.crt \
		-subj "/CN=$(MINIKUBE_IP)/O=DevOps" \
		-addext "subjectAltName=IP:$(MINIKUBE_IP)" 2>/dev/null
	kubectl create secret tls devops-tasks-tls \
		--cert=/tmp/devops-tasks-tls.crt \
		--key=/tmp/devops-tasks-tls.key \
		--dry-run=client -o yaml | kubectl apply -f -
	kubectl set env deployment/frontend-deployment \
		VITE_KEYCLOAK_URL=https://$(MINIKUBE_IP) \
		VITE_API_URL=/api
	kubectl set env deployment/backend-deployment \
		KEYCLOAK_ISSUER=https://$(MINIKUBE_IP)
	kubectl rollout status deployment/frontend-deployment --timeout=120s
	kubectl rollout status deployment/backend-deployment --timeout=120s
	@echo "✅  https://$(MINIKUBE_IP)  |  Admin KC: https://$(MINIKUBE_IP)/admin (admin/admin)"
	@echo "⚠️  Accepter l'avertissement certificat dans le navigateur"
