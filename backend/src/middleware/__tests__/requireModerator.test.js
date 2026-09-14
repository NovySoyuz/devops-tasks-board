// backend/src/middleware/__tests__/requireModerator.test.js
const requireModerator = require("../requireModerator");

function buildRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("requireModerator", () => {
    it("laisse passer un utilisateur avec le rôle moderator", () => {
        const req = { currentUser: { role: "moderator" } };
        const res = buildRes();
        const next = jest.fn();

        requireModerator(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("bloque avec 403 un utilisateur non-modérateur", () => {
        const req = { currentUser: { role: "user" } };
        const res = buildRes();
        const next = jest.fn();

        requireModerator(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Accès réservé aux modérateurs" });
        expect(next).not.toHaveBeenCalled();
    });

    it("bloque avec 403 si req.currentUser est absent", () => {
        const req = {};
        const res = buildRes();
        const next = jest.fn();

        requireModerator(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
