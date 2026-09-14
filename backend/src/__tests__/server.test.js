const request = require("supertest");

jest.mock("../db", () => ({
    query: jest.fn(),
}));

const pool = require("../db");
const app = require("../server");

describe("GET /health", () => {
    it("retourne 200 avec { status: 'ok' }", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });
});

describe("GET /projects", () => {
    it("retourne la liste des projets", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: "Projet Alpha" }] });
        const res = await request(app).get("/projects");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 1, name: "Projet Alpha" }]);
    });
});

describe("GET /tasks", () => {
    it("retourne la liste des tâches", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, title: "Ma tâche", status: "todo" }] });
        const res = await request(app).get("/tasks");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 1, title: "Ma tâche", status: "todo" }]);
    });
});

describe("POST /tasks", () => {
    it("crée une tâche et retourne 201", async () => {
        const newTask = { id: 1, title: "Tâche CI", projectId: 1, type: "ci/cd", priority: "haute", status: "todo" };
        pool.query.mockResolvedValueOnce({ rows: [newTask] });

        const res = await request(app)
            .post("/tasks")
            .send({ title: "Tâche CI", projectId: 1, type: "ci/cd", priority: "haute", status: "todo" });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(newTask);
    });

    it("retourne 400 si title manquant", async () => {
        const res = await request(app).post("/tasks").send({ projectId: 1 });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("retourne 400 si projectId manquant", async () => {
        const res = await request(app).post("/tasks").send({ title: "Tâche sans projet" });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });
});

describe("POST /projects (modération)", () => {
    it("crée un projet et retourne 201", async () => {
        const newProject = { id: 1, name: "Nouveau projet", description: "desc" };
        pool.query.mockResolvedValueOnce({ rows: [newProject] });

        const res = await request(app)
            .post("/projects")
            .send({ name: "Nouveau projet", description: "desc" });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(newProject);
    });

    it("retourne 400 si name manquant", async () => {
        const res = await request(app).post("/projects").send({ description: "desc" });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });
});

describe("PUT /projects/:id (modération)", () => {
    it("met à jour un projet et retourne 200", async () => {
        const updated = { id: 1, name: "Projet renommé", description: "maj" };
        pool.query.mockResolvedValueOnce({ rows: [updated] });

        const res = await request(app)
            .put("/projects/1")
            .send({ name: "Projet renommé", description: "maj" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
    });

    it("retourne 404 si le projet n'existe pas", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).put("/projects/999").send({ name: "X" });
        expect(res.status).toBe(404);
    });
});

describe("DELETE /projects/:id (modération)", () => {
    it("supprime un projet et retourne 204", async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 });
        const res = await request(app).delete("/projects/1");
        expect(res.status).toBe(204);
    });

    it("retourne 409 si des tâches sont encore associées", async () => {
        const fkError = new Error("violates foreign key constraint");
        fkError.code = "23503";
        pool.query.mockRejectedValueOnce(fkError);

        const res = await request(app).delete("/projects/1");
        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty("error");
    });
});

describe("GET /admin/users (modération)", () => {
    it("retourne la liste des utilisateurs", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: "a@a.com", role: "user", banned: false }] });
        const res = await request(app).get("/admin/users");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 1, email: "a@a.com", role: "user", banned: false }]);
    });
});

describe("DELETE /admin/users/:id (modération)", () => {
    it("bannit un utilisateur et retourne 204", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        const res = await request(app).delete("/admin/users/1");
        expect(res.status).toBe(204);
    });

    it("retourne 404 si l'utilisateur n'existe pas", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).delete("/admin/users/999");
        expect(res.status).toBe(404);
    });
});
