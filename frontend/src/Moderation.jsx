// frontend/src/Moderation.jsx
import { useEffect, useState } from "react";
import { API_URL, getAuthHeaders } from "./api";

const emptyProjectForm = { id: null, name: "", description: "" };

function Moderation({ getAccessTokenSilently, projects, onProjectsChange }) {
    const [users, setUsers]             = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError]             = useState("");
    const [projectForm, setProjectForm] = useState(emptyProjectForm);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);
                const headers = await getAuthHeaders(getAccessTokenSilently);
                const res = await fetch(`${API_URL}/admin/users`, { headers });
                if (!res.ok) throw new Error("Erreur de récupération des utilisateurs");
                setUsers(await res.json());
            } catch (err) {
                console.error(err);
                setError("Impossible de charger les utilisateurs.");
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, [getAccessTokenSilently]);

    const handleBanUser = async (id) => {
        if (!window.confirm("Bannir cet utilisateur ? Il perdra l'accès à l'application.")) return;
        try {
            const headers = await getAuthHeaders(getAccessTokenSilently);
            const res = await fetch(`${API_URL}/admin/users/${id}`, { method: "DELETE", headers });
            if (!res.ok) throw new Error("Erreur lors du bannissement");
            setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned: true } : u)));
        } catch (err) {
            console.error(err);
            setError("Impossible de bannir cet utilisateur.");
        }
    };

    const handleProjectChange = (e) => {
        const { name, value } = e.target;
        setProjectForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!projectForm.name.trim()) {
            setError("Le nom du projet est obligatoire.");
            return;
        }
        try {
            const authHeaders = await getAuthHeaders(getAccessTokenSilently);
            const isEdit = projectForm.id !== null;
            const res = await fetch(`${API_URL}/projects${isEdit ? `/${projectForm.id}` : ""}`, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({
                    name: projectForm.name.trim(),
                    description: projectForm.description.trim(),
                }),
            });
            if (!res.ok) throw new Error("Erreur lors de l'enregistrement du projet");
            const saved = await res.json();
            onProjectsChange((prev) =>
                isEdit ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]
            );
            setProjectForm(emptyProjectForm);
        } catch (err) {
            console.error(err);
            setError("Impossible d'enregistrer le projet.");
        }
    };

    const handleEditProject = (project) => {
        setProjectForm({ id: project.id, name: project.name, description: project.description || "" });
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Supprimer ce projet ?")) return;
        try {
            const headers = await getAuthHeaders(getAccessTokenSilently);
            const res = await fetch(`${API_URL}/projects/${id}`, { method: "DELETE", headers });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Erreur lors de la suppression");
            }
            onProjectsChange((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error(err);
            setError(err.message || "Impossible de supprimer ce projet.");
        }
    };

    return (
        <div className="mod">
            {error && <div className="feedback feedback--error">⚠️&nbsp;{error}</div>}

            <section className="card">
                <h2 className="section-heading">Utilisateurs</h2>
                {loadingUsers ? (
                    <p className="kanban-col__empty">Chargement…</p>
                ) : (
                    <table className="mod-table">
                        <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Statut</th>
                            <th>Dernière connexion</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.name || "—"}</td>
                                <td>{u.email || "—"}</td>
                                <td><span className={`badge badge--role-${u.role}`}>{u.role}</span></td>
                                <td>
                                    {u.banned
                                        ? <span className="badge badge--priority-haute">Banni</span>
                                        : <span className="badge badge--priority-basse">Actif</span>}
                                </td>
                                <td>{u.last_login ? new Date(u.last_login).toLocaleString("fr-FR") : "—"}</td>
                                <td>
                                    {!u.banned && (
                                        <button className="btn btn--danger btn--sm" onClick={() => handleBanUser(u.id)}>
                                            Bannir
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan={6} className="kanban-col__empty">Aucun utilisateur</td></tr>
                        )}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="card">
                <h2 className="section-heading">
                    {projectForm.id ? "Modifier le projet" : "Ajouter un projet"}
                </h2>
                <form onSubmit={handleProjectSubmit} className="task-form">
                    <div className="task-form__row">
                        <div className="field field--grow">
                            <label className="field__label">Nom</label>
                            <input
                                className="field__input"
                                type="text"
                                name="name"
                                value={projectForm.name}
                                onChange={handleProjectChange}
                                placeholder="Nom du projet"
                            />
                        </div>
                        <div className="field field--grow">
                            <label className="field__label">Description</label>
                            <input
                                className="field__input"
                                type="text"
                                name="description"
                                value={projectForm.description}
                                onChange={handleProjectChange}
                                placeholder="Description (optionnelle)"
                            />
                        </div>
                        <button type="submit" className="btn btn--primary">
                            {projectForm.id ? "Enregistrer" : "+ Ajouter"}
                        </button>
                        {projectForm.id && (
                            <button type="button" className="btn" onClick={() => setProjectForm(emptyProjectForm)}>
                                Annuler
                            </button>
                        )}
                    </div>
                </form>

                <table className="mod-table mod-table--projects">
                    <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Description</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {projects.map((p) => (
                        <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>{p.description || "—"}</td>
                            <td>
                                <button className="btn btn--sm" onClick={() => handleEditProject(p)}>Modifier</button>{" "}
                                <button className="btn btn--danger btn--sm" onClick={() => handleDeleteProject(p.id)}>Supprimer</button>
                            </td>
                        </tr>
                    ))}
                    {projects.length === 0 && (
                        <tr><td colSpan={3} className="kanban-col__empty">Aucun projet</td></tr>
                    )}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

export default Moderation;
