const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const pool = require("./db");
const authenticate = require("./middleware/auth");
const { taskSchema } = require("./schemas/taskSchema");

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

// Route publique — pas d'auth
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// Routes protégées par le JWT Keycloak
app.get("/projects", authenticate, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM projects ORDER BY id");
    res.json(rows);
});

app.get("/tasks", authenticate, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id");
    res.json(rows);
});

app.post("/tasks", authenticate, async (req, res) => {
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

// Suppression d'une tâche par son identifiant
app.delete("/tasks/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Tâche introuvable" });
    res.status(204).end();
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
    });
}

module.exports = app;