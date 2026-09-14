// frontend/src/__tests__/Moderation.test.jsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import Moderation from "../Moderation";

const mockUsers = [
    { id: 1, name: "Alice", email: "alice@test.fr", role: "user", banned: false, last_login: "2026-01-01T10:00:00Z" },
];
const mockProjects = [{ id: 1, name: "Projet Alpha", description: "Desc alpha" }];

const getAccessTokenSilently = vi.fn().mockResolvedValue("mock-access-token"); // NOSONAR - valeur factice de test, pas un vrai token

function setupFetch({ usersOk = true, projectOk = true } = {}) {
    return vi.fn((url, options = {}) => {
        if (url.includes("/admin/users") && !options.method) {
            return Promise.resolve({ ok: usersOk, json: () => Promise.resolve(mockUsers) });
        }
        if (url.includes("/admin/users/") && options.method === "DELETE") {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }
        if (url.includes("/projects") && options.method === "POST") {
            return Promise.resolve({
                ok: projectOk,
                json: () => Promise.resolve({ id: 2, name: "Projet Beta", description: "" }),
            });
        }
        if (url.includes("/projects") && options.method === "PUT") {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ id: 1, name: "Projet Alpha modifié", description: "Desc alpha" }),
            });
        }
        if (url.includes("/projects") && options.method === "DELETE") {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }
        return Promise.reject(new Error("URL inconnue: " + url));
    });
}

beforeEach(() => {
    vi.stubGlobal("confirm", vi.fn(() => true));
});

describe("Moderation", () => {
    it("affiche la liste des utilisateurs après chargement", async () => {
        vi.stubGlobal("fetch", setupFetch());
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText("alice@test.fr")).toBeInTheDocument();
        });
        expect(screen.getByText("Projet Alpha")).toBeInTheDocument();
    });

    it("affiche une erreur si le chargement des utilisateurs échoue", async () => {
        vi.stubGlobal("fetch", setupFetch({ usersOk: false }));
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText(/Impossible de charger les utilisateurs/i)).toBeInTheDocument();
        });
    });

    it("bannit un utilisateur après confirmation", async () => {
        vi.stubGlobal("fetch", setupFetch());
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={vi.fn()} />);

        const banBtn = await screen.findByText("Bannir");
        fireEvent.click(banBtn);

        await waitFor(() => {
            expect(screen.getByText("Banni")).toBeInTheDocument();
        });
    });

    it("ne bannit pas si la confirmation est annulée", async () => {
        vi.stubGlobal("confirm", vi.fn(() => false));
        vi.stubGlobal("fetch", setupFetch());
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={vi.fn()} />);

        const banBtn = await screen.findByText("Bannir");
        fireEvent.click(banBtn);

        await waitFor(() => {
            expect(screen.getByText("Actif")).toBeInTheDocument();
        });
    });

    it("crée un nouveau projet", async () => {
        vi.stubGlobal("fetch", setupFetch());
        const onProjectsChange = vi.fn();
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={onProjectsChange} />);

        await waitFor(() => expect(screen.getByText("alice@test.fr")).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText("Nom du projet"), { target: { value: "Projet Beta" } });
        fireEvent.click(screen.getByText("+ Ajouter"));

        await waitFor(() => {
            expect(onProjectsChange).toHaveBeenCalled();
        });
    });

    it("affiche une erreur si le nom du projet est vide à la création", async () => {
        vi.stubGlobal("fetch", setupFetch());
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={vi.fn()} />);

        await waitFor(() => expect(screen.getByText("alice@test.fr")).toBeInTheDocument());
        fireEvent.click(screen.getByText("+ Ajouter"));

        await waitFor(() => {
            expect(screen.getByText(/Le nom du projet est obligatoire/i)).toBeInTheDocument();
        });
    });

    it("modifie un projet existant", async () => {
        vi.stubGlobal("fetch", setupFetch());
        const onProjectsChange = vi.fn();
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={onProjectsChange} />);

        await waitFor(() => expect(screen.getByText("alice@test.fr")).toBeInTheDocument());

        fireEvent.click(screen.getByText("Modifier"));
        expect(screen.getByText("Modifier le projet")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Enregistrer"));

        await waitFor(() => {
            expect(onProjectsChange).toHaveBeenCalled();
        });
    });

    it("supprime un projet", async () => {
        vi.stubGlobal("fetch", setupFetch());
        const onProjectsChange = vi.fn();
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={onProjectsChange} />);

        await waitFor(() => expect(screen.getByText("alice@test.fr")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Supprimer"));

        await waitFor(() => {
            expect(onProjectsChange).toHaveBeenCalled();
        });
    });

    it("annule l'édition d'un projet", async () => {
        vi.stubGlobal("fetch", setupFetch());
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={vi.fn()} />);

        await waitFor(() => expect(screen.getByText("alice@test.fr")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Modifier"));
        expect(screen.getByText("Modifier le projet")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Annuler"));
        await waitFor(() => {
            expect(screen.getByText("Ajouter un projet")).toBeInTheDocument();
        });
    });

    it("affiche l'erreur renvoyée par l'API si la suppression du projet échoue (ex. contrainte FK)", async () => {
        vi.stubGlobal("fetch", vi.fn((url, options = {}) => {
            if (url.includes("/admin/users")) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUsers) });
            }
            if (url.includes("/projects") && options.method === "DELETE") {
                return Promise.resolve({
                    ok: false,
                    json: () => Promise.resolve({ error: "Impossible de supprimer : des tâches sont encore associées à ce projet" }),
                });
            }
            return Promise.reject(new Error("URL inconnue: " + url));
        }));
        render(<Moderation getAccessTokenSilently={getAccessTokenSilently} projects={mockProjects} onProjectsChange={vi.fn()} />);

        await waitFor(() => expect(screen.getByText("alice@test.fr")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Supprimer"));

        await waitFor(() => {
            expect(screen.getByText(/des tâches sont encore associées/i)).toBeInTheDocument();
        });
    });
});
