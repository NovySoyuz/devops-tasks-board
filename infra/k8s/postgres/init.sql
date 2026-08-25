CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    "projectId" INTEGER REFERENCES projects(id),
    type TEXT DEFAULT 'général',
    priority TEXT DEFAULT 'normale',
    status TEXT DEFAULT 'todo'
    );

INSERT INTO projects (name, description) VALUES
    ('Plateforme e-commerce', 'Projet de vente en ligne'),
    ('API interne RH', 'Gestion des ressources humaines'),
    ('Monitoring Kubernetes', 'Suivi de plateformes Cloud');

INSERT INTO tasks (title, "projectId", type, priority, status) VALUES
    ('Ajouter analyse SAST dans le pipeline', 1, 'CI/CD', 'haute', 'todo'),
    ('Configurer Trivy sur les images Docker', 1, 'sécurité', 'normale', 'doing'),
    ('Ajouter livenessProbe sur le backend', 3, 'infra', 'haute', 'todo');