import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import App from "../App";

vi.mock("@auth0/auth0-react", () => ({
    useAuth0: () => ({
        isAuthenticated: true,
        isLoading: false,
        loginWithRedirect: vi.fn(),
        logout: vi.fn(),
        getAccessTokenSilently: vi.fn().mockResolvedValue("mock-token"),
        user: { nickname: "testuser", name: "Test User" },
    }),
}));

const mockProjects = [{ id: 1, name: "Projet Alpha" }];
const mockTasks = [
    { id: 1, title: "Ma tâche", projectId: 1, type: "général", priority: "normale", status: "todo" },
];

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn((url) => {
        if (url.includes("/projects")) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProjects) });
        }
        if (url.includes("/tasks")) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks) });
        }
        return Promise.reject(new Error("URL inconnue"));
    }));
});

describe("App", () => {
    it("affiche le titre de l'application", () => {
        render(<App />);
        expect(screen.getByText("DevOps Tasks Board")).toBeInTheDocument();
    });

    it("affiche le formulaire d'ajout de tâche", () => {
        render(<App />);
        expect(screen.getByText("Ajouter une nouvelle tâche")).toBeInTheDocument();
    });

    it("affiche les tâches après chargement", async () => {
        render(<App />);
        await waitFor(() => {
            expect(screen.getByText("Ma tâche")).toBeInTheDocument();
        });
    });

    it("affiche un message si le backend est inaccessible", async () => {
        vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false })));
        render(<App />);
        await waitFor(() => {
            expect(screen.getByText(/Impossible de charger/i)).toBeInTheDocument();
        });
    });
});
