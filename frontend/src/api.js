// frontend/src/api.js
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Claim personnalisé injecté par l'Auth0 Action "Add roles to token" (voir README)
export const ROLES_CLAIM = `${import.meta.env.VITE_AUTH0_AUDIENCE || "https://devops-tasks-api"}/roles`;

export async function getAuthHeaders(getToken) {
    const token = await getToken(); // lève une exception si non authentifié → bloque l'appel API
    return { Authorization: `Bearer ${token}` };
}
