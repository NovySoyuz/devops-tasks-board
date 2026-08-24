# Image de base Node
FROM node:18-alpine
# Dossier de travail dans le conteneur
WORKDIR /app
# Copier les fichiers de configuration
COPY package*.json ./
# Installer les dépendances
RUN npm install
# Copier le reste du code
COPY . .
# Port exposé par le backend
EXPOSE 3000
# Commande de démarrage
CMD ["npm", "start"]
