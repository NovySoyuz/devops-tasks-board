// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const isKeycloakEnabled = !!process.env.KEYCLOAK_URL;

// KEYCLOAK_URL    : URL interne pour récupérer les clés JWKS (ex: http://keycloak:8080 dans Docker)
// KEYCLOAK_ISSUER : URL publique vue du navigateur pour valider l'issuer du JWT
//                   (ex: http://localhost:8080 en dev Docker)
//                   Si absent, on utilise KEYCLOAK_URL (cas local / K8s via NodePort)
const issuerBase = process.env.KEYCLOAK_ISSUER || process.env.KEYCLOAK_URL;

const client = isKeycloakEnabled
    ? jwksClient({
        jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
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
    if (!isKeycloakEnabled) return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token manquant ou invalide" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(
        token,
        getKey,
        {
            issuer: `${issuerBase}/realms/${process.env.KEYCLOAK_REALM}`,
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