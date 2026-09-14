// backend/src/middleware/loadUser.js
const pool = require("./../db");
const authenticate = require("./auth");

// Synchronise l'utilisateur authentifié dans la table locale `users` à chaque requête
// et bloque l'accès si un modérateur l'a banni. Le rôle "moderator" est décidé côté
// Auth0 (Roles + Action) et transmis via le claim personnalisé ROLES_CLAIM du token ;
// il est simplement mis en cache ici pour affichage dans l'espace de modération.
async function loadUser(req, res, next) {
    if (!authenticate.isAuthEnabled) {
        req.currentUser = { role: "moderator", banned: false }; // mode dev/test sans Auth0
        return next();
    }

    const sub = req.user?.sub;
    const email = req.user?.email || null;
    const name = req.user?.name || req.user?.nickname || null;
    const roles = req.user?.[authenticate.ROLES_CLAIM] || [];
    const role = roles.includes("moderator") ? "moderator" : "user";

    try {
        const { rows } = await pool.query(
            `INSERT INTO users (auth0_sub, email, name, role, last_login)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (auth0_sub)
             DO UPDATE SET email = $2, name = $3, role = $4, last_login = NOW()
             RETURNING id, role, banned`,
            [sub, email, name, role]
        );
        const current = rows[0];
        if (current.banned) {
            return res.status(403).json({ error: "Compte suspendu par un modérateur" });
        }
        req.currentUser = current;
        next();
    } catch (err) {
        console.error("loadUser error:", err.message);
        res.status(500).json({ error: "Erreur serveur" });
    }
}

module.exports = loadUser;
