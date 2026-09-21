# ---- Étape 1 : installation des dépendances de production ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
# --omit=dev : pas d'ESLint/Jest/nodemon dans l'image finale (surface d'attaque réduite)
RUN npm ci --omit=dev --ignore-scripts

# ---- Étape dev : image utilisée en local/minikube pour le hot reload (nodemon + tout le code monté en volume) ----
FROM node:24-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["node_modules/.bin/nodemon", "--legacy-watch", "src/server.js"]

# ---- Étape 2 : image d'exécution (production) ----
FROM node:24-alpine
WORKDIR /app
# Applique les derniers correctifs de sécurité des paquets système Alpine (ex : OpenSSL)
RUN apk update && apk upgrade --no-cache
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
# Le CLI npm n'est pas nécessaire à l'exécution (on lance node directement) :
# le retirer supprime au passage ses propres dépendances vulnérables (tar, brace-expansion...)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
# Passer sur l'utilisateur non-root
USER node
# Port exposé par le backend
EXPOSE 3000
# Commande de démarrage (appel direct de node, npm non disponible dans l'image finale)
CMD ["node", "src/server.js"]
