const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
// Charger les variables d'environnement
dotenv.config();
const app = express();
// Middlewares
app.use(cors());
app.use(express.json());
// Port (par défaut 3000)
const PORT = process.env.PORT || 3000;
// Données en mémoire (mock)
// On remplacera plus tard par PostgreSQL
let projects = [
    { id: 1, name: "Plateforme e-commerce", description: "Projet de vente en ligne" },
    { id: 2, name: "API interne RH", description: "Gestion des ressources humaines" },
    { id: 3, name: "Monitoring Kubernetes", description: "Suivi de plateformes Cloud" }
];
let tasks = [
    {
        id: 1,
        title: "Ajouter analyse SAST dans le pipeline",
        projectId: 1,
        type: "CI/CD",
        priority: "haute",
        status: "todo"
    },
    {
        id: 2,
        title: "Configurer Trivy sur les images Docker",
        projectId: 1,
        type: "sécurité",
        priority: "normale",
        status: "doing"
    },
    {
        id: 3,
        title: "Ajouter livenessProbe sur le backend",
        projectId: 3,
        type: "infra",
        priority: "haute",
        status: "todo"
    }
];
// Route de santé (pour K8s plus tard)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Backend DevOps Tasks Board opérationnel" });
    });
// Récupérer tous les projets
    app.get("/projects", (req, res) => {
        res.json(projects);
    });
// Récupérer toutes les tâches
    app.get("/tasks", (req, res) => {
        res.json(tasks);
    });
// Créer une nouvelle tâche
    app.post("/tasks", (req, res) => {
        const { title, projectId, type, priority, status } = req.body;
        if (!title || !projectId) {
            return res.status(400).json({ error: "title et projectId sont obligatoires" });
            }
            const newTask = {
                id: tasks.length + 1,
                title,
                projectId,
                type: type || "général",
                priority: priority || "normale",
                status: status || "todo"
            };
            tasks.push(newTask);
            res.status(201).json(newTask);
        });
// Démarrage du serveur
        app.listen(PORT, () => {
            console.log(`✅ Backend DevOps Tasks Board démarré sur http://localhost:${PORT}`);
        });
