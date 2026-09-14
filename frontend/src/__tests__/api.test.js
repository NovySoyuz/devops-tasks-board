// frontend/src/__tests__/api.test.js
import { describe, it, expect } from "vitest";
import { toSafeId } from "../api";

describe("toSafeId", () => {
    it("accepte un identifiant numérique valide", () => {
        expect(toSafeId(42)).toBe(42);
        expect(toSafeId("42")).toBe(42);
        expect(toSafeId(0)).toBe(0);
    });

    it("rejette les valeurs non entières, négatives ou non numériques", () => {
        expect(() => toSafeId("abc")).toThrow("Identifiant invalide");
        expect(() => toSafeId("1; DROP TABLE users")).toThrow("Identifiant invalide");
        expect(() => toSafeId("../../etc/passwd")).toThrow("Identifiant invalide");
        expect(() => toSafeId(-1)).toThrow("Identifiant invalide");
        expect(() => toSafeId(1.5)).toThrow("Identifiant invalide");
        expect(() => toSafeId(undefined)).toThrow("Identifiant invalide");
    });
});
