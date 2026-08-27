# Image de base Node
FROM node:18-alpine
# Dossier de travail dans le conteneur
WORKDIR /app
# Copier les fichiers de configuration
COPY package*.json ./
# Installer les dépendances (--ignore-scripts évite l'exécution de scripts tiers malveillants)
RUN npm ci --ignore-scripts
# Copier le reste du code avec ownership sur l'utilisateur node (non-root)
COPY --chown=node:node . .
# Passer sur l'utilisateur non-root
USER node
# Port exposé par le backend
EXPOSE 3000
# Commande de démarrage
CMD ["npm", "start"]
