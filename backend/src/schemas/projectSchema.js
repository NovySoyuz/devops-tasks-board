// backend/src/schemas/projectSchema.js
const { z } = require("zod");

// Schéma de validation pour la création/modification d'un projet (espace modération).
const projectSchema = z.object({
    name: z.string().trim().min(1, "name est obligatoire").max(150),
    description: z.string().trim().max(1000).optional().default(""),
});

module.exports = { projectSchema };
