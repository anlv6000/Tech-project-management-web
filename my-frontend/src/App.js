
    import React, { useEffect, useState } from 'react';
    import './App.css';
    import * as api from './api';
    import Layout from './components/Layout';
    import AuthPage from './components/AuthPage';
    import SpacePage from './components/SpacePage';
    import ProjectCreateModal from './components/ProjectCreateModal';

    function App() {
      const [token, setToken] = useState(localStorage.getItem('token'));
      const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
      const [projects, setProjects] = useState([]);
      const [currentProject, setCurrentProject] = useState(null);
      const [view, setView] = useState('home'); // home, space, projects

      useEffect(() => {
        if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
      }, [token]);

      useEffect(() => { localStorage.setItem('user', JSON.stringify(user || null)); }, [user]);

      useEffect(() => { fetchProjects(); }, [token]);

      async function fetchProjects() {
        try {
          const res = await api.getProjects(token);
          if (Array.isArray(res)) setProjects(res);
          else setProjects([]);
        } catch (err) {
          // fallback: try to read projects from localStorage or use demo data
          const demo = JSON.parse(localStorage.getItem('demo_projects') || 'null');
          if (demo) setProjects(demo);
          else {
            const sample = [
              { id: 'p1', name: 'Website Redesign', description: 'Revamp company website', tasks: [ { id: 't1', title: 'Design mockups', status: 'TO DO' }, { id: 't2', title: 'Implement header', status: 'IN PROGRESS' } ] },
              { id: 'p2', name: 'Mobile App', description: 'Build mobile app', tasks: [ { id: 't3', title: 'Auth flow', status: 'DONE' } ] }
            ];
            setProjects(sample);
            localStorage.setItem('demo_projects', JSON.stringify(sample));
          }
        }
      }

      function handleLoginSuccess({ token, user }) {
        setToken(token);
        setUser(user || { name: 'Demo User', role: 'Member', id: 'u1' });
        setView('home');
      }

      function handleLogout() {
        setToken(null); setUser(null); setCurrentProject(null); setView('home');
      }

      function openProject(project) {
        setCurrentProject(project);
        setView('space');
        // record recent
        const rec = JSON.parse(localStorage.getItem('recent_projects') || '[]');
        const updated = [project.id, ...rec.filter(id => id !== project.id)].slice(0, 8);
        localStorage.setItem('recent_projects', JSON.stringify(updated));
      }

      function updateProject(updated) {
        const list = projects.map(p => p.id === updated.id ? updated : p);
        setProjects(list);
        localStorage.setItem('demo_projects', JSON.stringify(list));
        if (currentProject && currentProject.id === updated.id) setCurrentProject(updated);
      }

      const [createOpen, setCreateOpen] = useState(false);

      async function handleCreateProjectLocal(payload) {
        // if backend available, use api.createProject
        try {
          if (token) {
            const res = await api.createProject(payload, token);
            if (res && res.id) { fetchProjects(); setCreateOpen(false); return; }
          }
        } catch (err) { /* ignore */ }
        // fallback local
        const newId = (projects.length ? Math.max(...projects.map(p => Number(p.id))) + 1 : 1).toString();
        const newProj = { id: newId, name: payload.name, description: payload.description || '', ownerId: user?.id || null, tasks: [] };
        const list = [newProj, ...projects];
        setProjects(list); localStorage.setItem('demo_projects', JSON.stringify(list));
        setCreateOpen(false);
      }

      return (
        <div className="App">
          {!token ? (
            <AuthPage onSuccess={handleLoginSuccess} api={api} />
          ) : (
            <Layout
              user={user}
              onLogout={handleLogout}
              projects={projects}
              openProject={openProject}
              setView={setView}
              view={view}
              onCreateClick={() => setCreateOpen(true)}
            >
              {view === 'home' && (
                <div className="page-content">
                  <h2>Welcome, {user?.name}</h2>
                  <p>Select a project from the left to open its Space, or create a new project.</p>
                </div>
              )}

              {view === 'space' && currentProject && (
                <SpacePage project={currentProject} updateProject={updateProject} api={api} />
              )}

              {view === 'projects' && (
                <div className="page-content">
                  <h3>Your Projects</h3>
                  <ul className="project-list">
                    {projects.map(p => (
                      <li key={p.id}>
                        <a href="#" onClick={e => { e.preventDefault(); openProject(p); }}>{p.name}</a>
                        <div className="muted">{p.description}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Layout>
          )}
          <ProjectCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateProjectLocal} />
        </div>
      );
    }

    export default App;
