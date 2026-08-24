import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    projectId: "",
    type: "général",
    priority: "normale",
    status: "todo",
  });

  // Charger les projets et les tâches au démarrage
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [projectsRes, tasksRes] = await Promise.all([
          fetch(`${API_URL}/projects`),
          fetch(`${API_URL}/tasks`),
        ]);
        if (!projectsRes.ok || !tasksRes.ok) {
          throw new Error("Erreur de récupération des données");
        }
        const projectsData = await projectsRes.json();
        const tasksData = await tasksRes.json();
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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.projectId) {
      setError("Le titre et le projet sont obligatoires.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          projectId: Number(form.projectId),
          type: form.type,
          priority: form.priority,
          status: form.status,
        }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la création de la tâche.");
      }
      const newTask = await response.json();
      setTasks((prev) => [...prev, newTask]);
      // Reset formulaire
      setForm({
        title: "",
        projectId: "",
        type: "général",
        priority: "normale",
        status: "todo",
      });
    } catch (err) {
      console.error(err);
      setError("Impossible de créer la tâche.");
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, Arial, sans-serif", padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>DevOps Tasks Board</h1>
      <p style={{ color: "#555" }}>
        Mini application pédagogique pour suivre les tâches DevOps / DevSecOps d&apos;un projet.
      </p>
      <div style={{ margin: "1rem 0", padding: "0.75rem", background: "#f5f5f5", borderRadius: "8px" }}>
        <strong>Backend API :</strong> <code>{API_URL}</code>
      </div>
      {loading && <p>Chargement des données...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Formulaire de création de tâche */}
      <section style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>
        <h2>Ajouter une nouvelle tâche</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: "500px" }}>
          <div>
            <label>
              Titre de la tâche<br />
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.4rem" }}
                placeholder="Ex : Ajouter un test d'intégration"
              />
            </label>
          </div>
          <div>
            <label>
              Projet<br />
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.4rem" }}
              >
                <option value="">-- Sélectionner un projet --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
            <div>
              <label>
                Type<br />
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "0.4rem" }}
                >
                  <option value="général">Général</option>
                  <option value="ci/cd">CI/CD</option>
                  <option value="sécurité">Sécurité</option>
                  <option value="infra">Infra</option>
                </select>
              </label>
            </div>
            <div>
              <label>
                Priorité<br />
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "0.4rem" }}
                >
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="basse">Basse</option>
                </select>
              </label>
            </div>
            <div>
              <label>
                Statut<br />
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "0.4rem" }}
                >
                  <option value="todo">À faire</option>
                  <option value="doing">En cours</option>
                  <option value="done">Terminé</option>
                </select>
              </label>
            </div>
          </div>
          <button
            type="submit"
            style={{ padding: "0.5rem 1rem", background: "#0052cc", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Ajouter la tâche
          </button>
        </form>
      </section>

      {/* Liste des tâches */}
      <section>
        <h2>Liste des tâches</h2>
        {tasks.length === 0 ? (
          <p>Aucune tâche pour le moment.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
            {tasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              return (
                <li
                  key={task.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "0.75rem",
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{task.title}</strong>
                    <span style={{ fontSize: "0.85rem", color: "#666" }}>
                      Statut : <em>{task.status}</em>
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>
                    Projet :{" "}
                    <strong>{project ? project.name : `#${task.projectId}`}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "#555" }}>
                    Type : {task.type} — Priorité : {task.priority}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;