FROM node:22-alpine
WORKDIR /app
# Copier les fichiers de configuration
COPY package*.json ./
# Installer les dépendances
RUN npm install
# Copier le reste du code
COPY . .
# Variables nécessaires pour Vite (port par défaut 5173)
EXPOSE 5173
# Lancer le serveur de dev Vite accessible depuis l'extérieur
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]