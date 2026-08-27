FROM node:22-alpine
WORKDIR /app
# Copier les fichiers de configuration
COPY package*.json ./
# Installer les dépendances (--ignore-scripts évite l'exécution de scripts tiers malveillants)
RUN npm ci --ignore-scripts
# Copier le reste du code et transférer tout /app à l'utilisateur node
COPY . .
RUN chown -R node:node /app
# Passer sur l'utilisateur non-root
USER node
# Variables nécessaires pour Vite (port par défaut 5173)
EXPOSE 5173
# Lancer le serveur de dev Vite accessible depuis l'extérieur
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]