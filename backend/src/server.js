const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");
const authenticate = require("./middleware/auth");

dotenv.config();

const app = express();
app.disable("x-powered-by"); // ne pas exposer la version d'Express dans les headers HTTP
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
    const { title, projectId, type, priority, status } = req.body;
    if (!title || !projectId) {
        return res.status(400).json({ error: "title et projectId sont obligatoires" });
    }
    const { rows } = await pool.query(
        `INSERT INTO tasks (title, "projectId", type, priority, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, projectId, type || "général", priority || "normale", status || "todo"]
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