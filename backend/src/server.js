const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const pool = require("./db");
const authenticate = require("./middleware/auth");
const loadUser = require("./middleware/loadUser");
const requireModerator = require("./middleware/requireModerator");
const { taskSchema, taskStatusSchema } = require("./schemas/taskSchema");
const { projectSchema } = require("./schemas/projectSchema");

dotenv.config({ quiet: true }); // désactive les logs/"tips" promotionnels de dotenv

const app = express();
app.disable("x-powered-by"); // ne pas exposer la version d'Express dans les headers HTTP
app.use(helmet());            // security headers (CSP, HSTS, X-Frame-Options, etc.)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:4173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Anti brute-force / anti-DDoS : limite chaque IP à 100 requêtes / 15 min sur l'API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de requêtes, veuillez réessayer plus tard." },
});
app.use(apiLimiter);

const PORT = process.env.PORT || 3000;

// Chaîne commune : vérifie le JWT puis synchronise/vérifie l'utilisateur (bannissement)
const requireAuth = [authenticate, loadUser];

// Route publique — pas d'auth
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// Routes protégées par le JWT Auth0
app.get("/projects", requireAuth, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM projects ORDER BY id");
    res.json(rows);
});

// Création d'un projet — réservé aux modérateurs
app.post("/projects", requireAuth, requireModerator, async (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, description } = parsed.data;
    const { rows } = await pool.query(
        `INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *`,
        [name, description]
    );
    res.status(201).json(rows[0]);
});

// Modification d'un projet — réservé aux modérateurs
app.put("/projects/:id", requireAuth, requireModerator, async (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, description } = parsed.data;
    const { rows } = await pool.query(
        `UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
        [name, description, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Projet introuvable" });
    res.json(rows[0]);
});

// Suppression d'un projet — réservé aux modérateurs (bloquée si des tâches y sont encore rattachées)
app.delete("/projects/:id", requireAuth, requireModerator, async (req, res) => {
    try {
        const { rowCount } = await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
        if (rowCount === 0) return res.status(404).json({ error: "Projet introuvable" });
        res.status(204).end();
    } catch (err) {
        if (err.code === "23503") { // violation de contrainte de clé étrangère (tasks.projectId)
            return res.status(409).json({ error: "Impossible de supprimer : des tâches sont encore associées à ce projet" });
        }
        console.error("DELETE /projects error:", err.message);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.get("/tasks", requireAuth, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id");
    res.json(rows);
});

app.post("/tasks", requireAuth, async (req, res) => {
    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { title, projectId, type, priority, status } = parsed.data;
    const { rows } = await pool.query(
        `INSERT INTO tasks (title, "projectId", type, priority, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, projectId, type, priority, status]
    );
    res.status(201).json(rows[0]);
});

// Changement de statut d'une tâche (à faire / en cours / terminé) — ouvert à
// tous les utilisateurs authentifiés (pas réservé aux modérateurs), permet à
// n'importe quel membre de l'équipe de faire avancer une tâche sur le tableau.
app.patch("/tasks/:id/status", requireAuth, async (req, res) => {
    const parsed = taskStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { rows } = await pool.query(
        `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
        [parsed.data.status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Tâche introuvable" });
    res.json(rows[0]);
});

// Suppression d'une tâche par son identifiant
app.delete("/tasks/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Tâche introuvable" });
    res.status(204).end();
});

// Liste des utilisateurs connus — réservé aux modérateurs (espace de modération)
app.get("/admin/users", requireAuth, requireModerator, async (req, res) => {
    const { rows } = await pool.query(
        "SELECT id, email, name, role, banned, created_at, last_login FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
});

// Bannissement d'un utilisateur (suppression "côté application" — son compte Auth0 n'est pas supprimé)
app.delete("/admin/users/:id", requireAuth, requireModerator, async (req, res) => {
    const { rows } = await pool.query(
        "UPDATE users SET banned = true WHERE id = $1 RETURNING id",
        [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.status(204).end();
});

if (require.main === module) {
    const migrate = require("./migrate");
    migrate()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error("❌ Échec de la migration au démarrage:", err.message);
            process.exit(1);
        });
}

module.exports = app;