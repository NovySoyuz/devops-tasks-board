// backend/src/middleware/requireModerator.js

// Bloque l'accès si l'utilisateur authentifié n'a pas le rôle "moderator"
// (attaché à req.currentUser par le middleware loadUser).
function requireModerator(req, res, next) {
    if (req.currentUser?.role !== "moderator") {
        return res.status(403).json({ error: "Accès réservé aux modérateurs" });
    }
    next();
}

module.exports = requireModerator;
