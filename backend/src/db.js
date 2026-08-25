// fichier connexion à la base de données PostgreSQL
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

module.exports = pool;