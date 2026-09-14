// backend/src/middleware/__tests__/loadUser.test.js
jest.mock("../../db", () => ({
    query: jest.fn(),
}));
jest.mock("../auth", () => {
    const fn = () => {};
    fn.isAuthEnabled = true; // simule Auth0 actif pour tester la logique réelle de synchronisation
    fn.ROLES_CLAIM = "https://devops-tasks-api/roles";
    return fn;
});

const pool = require("../../db");
const authenticate = require("../auth");
const loadUser = require("../loadUser");

function buildRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    pool.query.mockReset();
});

describe("loadUser (Auth0 actif)", () => {
    it("synchronise un utilisateur standard et l'attache à req.currentUser", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, role: "user", banned: false }] });
        const req = { user: { sub: "auth0|1", email: "u@test.fr", name: "User" } };
        const res = buildRes();
        const next = jest.fn();

        await loadUser(req, res, next);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO users"),
            ["auth0|1", "u@test.fr", "User", "user"]
        );
        expect(req.currentUser).toEqual({ id: 1, role: "user", banned: false });
        expect(next).toHaveBeenCalled();
    });

    it("attribue le rôle moderator si le claim de rôles Auth0 le contient", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 2, role: "moderator", banned: false }] });
        const req = {
            user: {
                sub: "auth0|2",
                [authenticate.ROLES_CLAIM]: ["moderator"],
            },
        };
        const res = buildRes();
        const next = jest.fn();

        await loadUser(req, res, next);

        expect(pool.query).toHaveBeenCalledWith(
            expect.any(String),
            ["auth0|2", null, null, "moderator"]
        );
        expect(next).toHaveBeenCalled();
    });

    it("bloque avec 403 si l'utilisateur est banni", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 3, role: "user", banned: true }] });
        const req = { user: { sub: "auth0|3" } };
        const res = buildRes();
        const next = jest.fn();

        await loadUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Compte suspendu par un modérateur" });
        expect(next).not.toHaveBeenCalled();
    });

    it("retourne 500 en cas d'erreur base de données", async () => {
        pool.query.mockRejectedValueOnce(new Error("boom"));
        const req = { user: { sub: "auth0|4" } };
        const res = buildRes();
        const next = jest.fn();

        await loadUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});
