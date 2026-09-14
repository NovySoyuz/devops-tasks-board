import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import App from "../App";

const mockUseAuth0 = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
    useAuth0: () => mockUseAuth0(),
}));

const baseAuth = {
    isAuthenticated: true,
    isLoading: false,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn().mockResolvedValue("mock-token"), // NOSONAR - valeur factice de test, pas un vrai token
};

const mockProjects = [{ id: 1, name: "Projet Alpha" }];
const mockTasks = [
    { id: 1, title: "Ma tâche", projectId: 1, type: "général", priority: "normale", status: "todo" },
];
const mockUsers = [
    { id: 1, name: "Test User", email: "test@example.com", role: "user", banned: false, last_login: null },
];

beforeEach(() => {
    mockUseAuth0.mockReturnValue({
        ...baseAuth,
        user: { nickname: "testuser", name: "Test User" },
    });
    vi.stubGlobal("fetch", vi.fn((url) => {
        if (url.includes("/admin/users")) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
        }
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

    it("ne montre pas l'onglet Modération à un utilisateur standard", async () => {
        render(<App />);
        await waitFor(() => {
            expect(screen.getByText("Ma tâche")).toBeInTheDocument();
        });
        expect(screen.queryByText(/Modération/)).not.toBeInTheDocument();
    });

    it("montre l'onglet Modération et la liste des utilisateurs à un modérateur", async () => {
        mockUseAuth0.mockReturnValue({
            ...baseAuth,
            user: {
                nickname: "modo",
                name: "Modo User",
                "https://devops-tasks-api/roles": ["moderator"],
            },
        });
        render(<App />);
        const modTab = await screen.findByText(/Modération/);
        fireEvent.click(modTab);

        await waitFor(() => {
            expect(screen.getByText("test@example.com")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Tableau"));
        await waitFor(() => {
            expect(screen.getByText("Ajouter une nouvelle tâche")).toBeInTheDocument();
        });
    });
});

