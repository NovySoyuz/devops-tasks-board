const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/projects", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM projects ORDER BY id");
    res.json(rows);
});

app.get("/tasks", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id");
    res.json(rows);
});

app.post("/tasks", async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
});