-- Utilisateurs synchronisés automatiquement à chaque requête authentifiée (voir middleware loadUser.js).
-- Le rôle "moderator" est géré côté Auth0 (Roles + Action) et transmis via un claim du token JWT ;
-- il est mis en cache ici pour affichage. `banned` permet à un modérateur de retirer l'accès
-- d'un utilisateur sans dépendre de l'API Auth0 Management (suppression "simple" côté application).
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth0_sub TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator')),
    banned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP DEFAULT NOW()
);

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