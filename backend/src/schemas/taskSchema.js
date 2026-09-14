// backend/src/schemas/taskSchema.js
const { z } = require("zod");

// Schéma de validation du payload pour la création d'une tâche.
// Remplace les vérifications manuelles (if (!title...)) par un contrôle
// strict des types et des valeurs autorisées (anti-injection / anti-pollution).
const taskSchema = z.object({
    title: z.string().trim().min(1, "title est obligatoire").max(200),
    projectId: z.coerce.number().int().positive({ message: "projectId est obligatoire et doit être un entier positif" }),
    type: z.enum(["général", "ci/cd", "sécurité", "infra"]).default("général"),
    priority: z.enum(["haute", "normale", "basse"]).default("normale"),
    status: z.enum(["todo", "doing", "done"]).default("todo"),
});

module.exports = { taskSchema };
