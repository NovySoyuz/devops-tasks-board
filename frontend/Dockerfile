# ---- Étape 1 : installation des dépendances (dev incluses : Vite est utilisé en mode dev-server) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

# ---- Étape 2 : image d'exécution ----
FROM node:22-alpine
WORKDIR /app
# Applique les derniers correctifs de sécurité des paquets système Alpine (ex : OpenSSL)
RUN apk update && apk upgrade --no-cache
COPY --from=deps /app/node_modules ./node_modules
# Copier le reste du code et transférer tout /app à l'utilisateur node
COPY . .
RUN chown -R node:node /app && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
# Passer sur l'utilisateur non-root
USER node
# Variables nécessaires pour Vite (port par défaut 5173)
EXPOSE 5173
# Lancer le serveur de dev Vite directement (npm non disponible dans l'image finale)
CMD ["node_modules/.bin/vite", "--host", "0.0.0.0", "--port", "5173"]