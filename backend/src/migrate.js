// backend/src/migrate.js
const pool = require("./db");

// Migration idempotente exécutée au démarrage du serveur : garantit que la table
// "users" (nécessaire à la modération) existe même sur une base déjà initialisée
// avant son ajout (volume Docker existant, instance Render déjà provisionnée...).
// Le script infra/k8s/postgres/init.sql ne s'exécute en effet qu'à la toute
// première création de la base — il ne suffit pas pour une base déjà en place.
async function migrate() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            auth0_sub TEXT UNIQUE NOT NULL,
            email TEXT,
            name TEXT,
            role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator')),
            banned BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            last_login TIMESTAMP DEFAULT NOW()
        );
    `);
}

module.exports = migrate;
