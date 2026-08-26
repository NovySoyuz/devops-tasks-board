// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const AUTH0_DOMAIN   = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "https://devops-tasks-api";

const isAuthEnabled = !!AUTH0_DOMAIN;

const client = isAuthEnabled
    ? jwksClient({
        jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
    })
    : null;

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        callback(null, key.getPublicKey());
    });
}

function authenticate(req, res, next) {
    if (!isAuthEnabled) return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token manquant ou invalide" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(
        token,
        getKey,
        {
            issuer: `https://${AUTH0_DOMAIN}/`,
            audience: AUTH0_AUDIENCE,
            algorithms: ["RS256"],
        },
        (err, decoded) => {
            if (err) {
                console.error("JWT error:", err.message);
                return res.status(401).json({ error: "Token invalide ou expiré" });
            }
            req.user = decoded;
            next();
        }
    );
}

module.exports = authenticate;