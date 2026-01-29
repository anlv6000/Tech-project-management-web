import React, { useEffect, useState } from 'react';
import './index.css';
import api from './api';
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import SpacePage from './components/SpacePage';
import ProjectCreateModal from './components/ProjectCreateModal';
import ProfileModal from './components/ProfileModal';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [view, setView] = useState('home');

  useEffect(()=>{ if (token) localStorage.setItem('token', token); else localStorage.removeItem('token'); },[token]);
  useEffect(()=>{ localStorage.setItem('user', JSON.stringify(user||null)); },[user]);

  useEffect(()=>{ fetchProjects(); },[token]);

  async function fetchProjects(){
    try{
      const res = await api.getProjects(token);
      if (Array.isArray(res)) setProjects(res.map(p => ({ ...p, id: p._id || p.id })));
      else setProjects([]);
    } catch (err) {
      setProjects([]);
    }
  }

  function handleLoginSuccess({ token, user }){
    setToken(token);
    setUser(user || { name: 'Demo User', role: 'member', id: 'u1' });
    setView('home');
  }

  function handleLogout(){ setToken(null); setUser(null); setCurrentProject(null); setView('home'); }

  async function openProject(project){
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const full = await api.getProject(project._id || project.id);
        if (full) { setCurrentProject(full); setView('space'); return; }
      } catch (err) { /* fallback */ }
    }
    setCurrentProject(project); setView('space');
  }

  function updateProject(updated){
    const list = projects.map(p => (p.id === updated.id ? updated : p));
    setProjects(list);
    if (currentProject && (currentProject.id === updated.id || currentProject._id === updated._id)) setCurrentProject(updated);
  }

  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleCreateProject(payload){
    try {
      if (token) {
        const res = await api.createProject(payload, token);
        await fetchProjects(); setCreateOpen(false); return;
      }
    } catch (err) { /* ignore */ }
    const newId = `local-${Date.now()}`;
    const newProj = { id: newId, name: payload.name, description: payload.description||'', tasks: [] };
    setProjects([newProj,...projects]); setCreateOpen(false);
  }

  return (
    <div className="App">
      {!token ? (
        <AuthPage onSuccess={handleLoginSuccess} api={api} />
      ) : (
        <Layout user={user} onLogout={handleLogout} projects={projects} openProject={openProject} setView={setView} view={view} onCreateClick={()=>setCreateOpen(true)} onProfileClick={()=>setProfileOpen(true)}>
          {view==='home' && (
            <div>
              <h2>Welcome, {user?.name}</h2>
              <p>Select a project to open.</p>
            </div>
          )}
          {view==='projects' && (
            <div>
              <h3>Your Projects</h3>
              <ul>
                {projects.map(p => <li key={p.id}><a href="#" onClick={e=>{e.preventDefault(); openProject(p);}}>{p.name}</a></li>)}
              </ul>
            </div>
          )}
          {view==='space' && currentProject && (
            <SpacePage project={currentProject} updateProject={updateProject} />
          )}
        </Layout>
      )}

      <ProjectCreateModal open={createOpen} onClose={()=>setCreateOpen(false)} onCreate={handleCreateProject} />
      <ProfileModal open={profileOpen} user={user} onClose={()=>setProfileOpen(false)} onUpdate={(u)=>{ setUser(u); }} />
    </div>
  );
}

export default App;
