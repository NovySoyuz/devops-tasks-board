// frontend/src/api.js
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Claim personnalisé injecté par l'Auth0 Action "Add roles to token" (voir README)
export const ROLES_CLAIM = `${import.meta.env.VITE_AUTH0_AUDIENCE || "https://devops-tasks-api"}/roles`;

export async function getAuthHeaders(getToken) {
    const token = await getToken(); // lève une exception si non authentifié → bloque l'appel API
    return { Authorization: `Bearer ${token}` };
}

// Force un identifiant numérique "propre" avant de l'insérer dans une URL d'appel fetch
// (évite les alertes SAST SSRF/traversal en garantissant qu'aucune valeur arbitraire
// — chaîne, chemin, URL absolue — ne peut se glisser dans le chemin de la requête).
export function toSafeId(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n < 0) {
        throw new Error("Identifiant invalide");
    }
    return n;
}
