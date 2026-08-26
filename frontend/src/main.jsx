import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import keycloak from "./keycloak.js";

keycloak
    .init({ onLoad: "login-required", checkLoginIframe: false })
    .then((authenticated) => {
        if (!authenticated) {
            keycloak.login();
            return;
        }

        // Rafraîchit le token 30s avant son expiration (vérifie toutes les 60s)
        setInterval(() => {
            keycloak.updateToken(30).catch(() => keycloak.logout());
        }, 60000);

        createRoot(document.getElementById("root")).render(
            <StrictMode>
                <App keycloak={keycloak} />
            </StrictMode>
        );
    })
    .catch((err) => {
        const msg = err?.message || err?.error || String(err) || "Erreur inconnue";
        console.error("Échec de l'initialisation Keycloak", err);
        document.getElementById("root").innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;gap:16px;">
                <h2 style="color:#c0392b;">⚠️ Impossible de contacter Keycloak</h2>
                <p style="color:#555;max-width:420px;text-align:center;">
                    Vérifiez que Keycloak est démarré et que le realm
                    <strong>devops-tasks</strong> est bien configuré.
                </p>
                <code style="background:#f4f4f4;padding:8px 16px;border-radius:6px;font-size:13px;">
                    ${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}
                </code>
                <code style="background:#fde;padding:8px 16px;border-radius:6px;font-size:12px;color:#c0392b;max-width:500px;word-break:break-all;">
                    Erreur : ${msg}
                </code>
                <button onclick="location.reload()"
                    style="margin-top:8px;padding:10px 24px;background:#3498db;color:white;border:none;border-radius:6px;cursor:pointer;font-size:15px;">
                    Réessayer
                </button>
            </div>
        `;
    });