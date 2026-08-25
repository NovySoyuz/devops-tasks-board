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
