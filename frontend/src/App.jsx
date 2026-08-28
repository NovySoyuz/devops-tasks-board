import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const STATUS_COLUMNS = ["todo", "doing", "done"];
const STATUS_LABELS  = { todo: "À faire", doing: "En cours", done: "Terminé" };
const TYPE_LABELS     = { "général": "Général", "ci/cd": "CI/CD", "sécurité": "Sécurité", "infra": "Infra" };
const PRIORITY_LABELS = { haute: "Haute", normale: "Normale", basse: "Basse" };
const TYPE_CSS_KEY = {
  "général":  "general",
  "ci/cd":    "cicd",
  "sécurité": "securite",
  "infra":    "infra",
};

async function getAuthHeaders(getToken) {
  const token = await getToken(); // lève une exception si non authentifié → bloque l'appel API
  return { Authorization: `Bearer ${token}` };
}

function TaskCard({ task, project, onDelete }) {
  const typeKey = TYPE_CSS_KEY[task.type] ?? "general";

  return (
      <article className="task-card">
        <div className="task-card__header">
          <span className="task-card__title">{task.title}</span>
          <button
              className="task-card__delete"
              onClick={() => onDelete(task.id)}
              aria-label="Supprimer la tâche"
              title="Supprimer"
          >
            ✕
          </button>
        </div>
        <p className="task-card__project">
          {project ? project.name : `Projet #${task.projectId}`}
        </p>
        <div className="task-card__badges">
        <span className={`badge badge--type-${typeKey}`}>
          {TYPE_LABELS[task.type] ?? task.type}
        </span>
          <span className={`badge badge--priority-${task.priority}`}>
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
        </div>
      </article>
  );
}

function KanbanColumn({ status, tasks, projects, onDelete }) {
  return (
      <div className={`kanban-col kanban-col--${status}`}>
        <header className="kanban-col__header">
          <span>{STATUS_LABELS[status]}</span>
          <span className="kanban-col__count">{tasks.length}</span>
        </header>
        <div className="kanban-col__body">
          {tasks.length === 0 ? (
              <p className="kanban-col__empty">Aucune tâche</p>
          ) : (
              tasks.map((task) => (
                  <TaskCard
                      key={task.id}
                      task={task}
                      project={projects.find((p) => p.id === task.projectId)}
                      onDelete={onDelete}
                  />
              ))
          )}
        </div>
      </div>
  );
}

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently, user } = useAuth0();
  const [tasks, setTasks]             = useState([]);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [form, setForm] = useState({
    title: "",
    projectId: "",
    type: "général",
    priority: "normale",
    status: "todo",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) loginWithRedirect();
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const headers = await getAuthHeaders(getAccessTokenSilently);
        const [projectsRes, tasksRes] = await Promise.all([
          fetch(`${API_URL}/projects`, { headers }),
          fetch(`${API_URL}/tasks`, { headers }),
        ]);
        if (!projectsRes.ok || !tasksRes.ok) {
          throw new Error("Erreur de récupération des données");
        }
        const [projectsData, tasksData] = await Promise.all([
          projectsRes.json(),
          tasksRes.json(),
        ]);
        setProjects(projectsData);
        setTasks(tasksData);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données depuis le backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.projectId) {
      setError("Le titre et le projet sont obligatoires.");
      return;
    }
    try {
      const authHeaders = await getAuthHeaders(getAccessTokenSilently);
      const res = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          title: form.title.trim(),
          projectId: Number(form.projectId),
          type: form.type,
          priority: form.priority,
          status: form.status,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création de la tâche.");
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setForm({ title: "", projectId: "", type: "général", priority: "normale", status: "todo" });
    } catch (err) {
      console.error(err);
      setError("Impossible de créer la tâche.");
    }
  };

  const handleDelete = async (taskId) => {
    try {
      const headers = await getAuthHeaders(getAccessTokenSilently);
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression.");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer la tâche.");
    }
  };

  const visibleTasks = filterProject
      ? tasks.filter((t) => String(t.projectId) === filterProject)
      : tasks;

  const username = user?.nickname || user?.name;

  if (isLoading || !isAuthenticated) return null;

  return (
      <div className="app">
        <header className="app-header">
          <div className="app-header__top">
            <div className="app-header__brand">
              <span className="app-header__icon" aria-hidden="true">🛡️</span>
              <div>
                <h1 className="app-header__title">DevOps Tasks Board</h1>
                <p className="app-header__desc">
                  Suivi des tâches DevOps &amp; DevSecOps par projet.
                </p>
              </div>
            </div>

            <div className="stat-bar">
              {STATUS_COLUMNS.map((s) => (
                  <div key={s} className={`stat-chip stat-chip--${s}`}>
                <span className="stat-chip__count">
                  {tasks.filter((t) => t.status === s).length}
                </span>
                    <span className="stat-chip__label">{STATUS_LABELS[s]}</span>
                  </div>
              ))}
            </div>

            {username && (
                <div className="app-header__user">
                  <span className="app-header__username">👤 {username}</span>
                  <button
                      className="btn btn--logout"
                      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    Déconnexion
                  </button>
                </div>
            )}
          </div>
        </header>

        <main className="app-main">
          {loading && <div className="feedback feedback--loading">Chargement…</div>}
          {error   && <div className="feedback feedback--error">⚠️&nbsp;{error}</div>}

          <section className="card">
            <h2 className="section-heading">Ajouter une nouvelle tâche</h2>
            <form onSubmit={handleSubmit} className="task-form">
              <div className="task-form__row">
                <div className="field field--grow">
                  <label className="field__label">Titre</label>
                  <input
                      className="field__input"
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Ex : Ajouter un test d'intégration v2"
                  />
                </div>
                <div className="field">
                  <label className="field__label">Projet</label>
                  <select
                      className="field__select"
                      name="projectId"
                      value={form.projectId}
                      onChange={handleChange}
                  >
                    <option value="">— Sélectionner —</option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="task-form__row task-form__row--meta">
                <div className="field">
                  <label className="field__label">Type</label>
                  <select className="field__select" name="type" value={form.type} onChange={handleChange}>
                    <option value="général">Général</option>
                    <option value="ci/cd">CI/CD</option>
                    <option value="sécurité">Sécurité</option>
                    <option value="infra">Infra</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">Priorité</label>
                  <select className="field__select" name="priority" value={form.priority} onChange={handleChange}>
                    <option value="haute">Haute</option>
                    <option value="normale">Normale</option>
                    <option value="basse">Basse</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">Statut initial</label>
                  <select className="field__select" name="status" value={form.status} onChange={handleChange}>
                    <option value="todo">À faire</option>
                    <option value="doing">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>
                <button type="submit" className="btn btn--primary">
                  + Ajouter
                </button>
              </div>
            </form>
          </section>

          <section>
            <div className="board-toolbar">
              <h2 className="section-heading">Tableau des tâches</h2>
              <select
                  className="field__select field__select--sm"
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  aria-label="Filtrer par projet"
              >
                <option value="">Tous les projets</option>
                {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="kanban-board">
              {STATUS_COLUMNS.map((status) => (
                  <KanbanColumn
                      key={status}
                      status={status}
                      tasks={visibleTasks.filter((t) => t.status === status)}
                      projects={projects}
                      onDelete={handleDelete}
                  />
              ))}
            </div>
          </section>
        </main>
      </div>
  );
}

export default App;