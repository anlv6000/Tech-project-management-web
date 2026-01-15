import React, { useState, useEffect } from 'react';

function ProjectItem({ p, openProject }) {
  const starred = (JSON.parse(localStorage.getItem('starred_projects') || '[]')).includes(p.id);
  return (
    <div className="project-item">
      <a href="#" onClick={e => { e.preventDefault(); openProject(p); }}>{p.name}</a>
      <div className="muted">{p.description}</div>
      <div className="project-actions">
        <button onClick={(e) => { e.stopPropagation(); const s = JSON.parse(localStorage.getItem('starred_projects')||'[]'); if (s.includes(p.id)) { localStorage.setItem('starred_projects', JSON.stringify(s.filter(id=>id!==p.id))); } else { localStorage.setItem('starred_projects', JSON.stringify([p.id, ...s])); } e.currentTarget.blur(); }}>
          {starred ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ projects, openProject, setView, view }) {
  const [recent, setRecent] = useState([]);
  const [starredList, setStarredList] = useState([]);

  useEffect(() => { setRecent(JSON.parse(localStorage.getItem('recent_projects') || '[]')); setStarredList(JSON.parse(localStorage.getItem('starred_projects') || '[]')); }, [projects]);

  const recentProjects = recent.map(id => projects.find(p => p.id === id)).filter(Boolean);
  const starredProjects = starredList.map(id => projects.find(p => p.id === id)).filter(Boolean);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h3>Spaces</h3>
        <nav>
          <button className={view==='home'? 'active':''} onClick={() => setView('home')}>Home</button>
          <button className={view==='projects'? 'active':''} onClick={() => setView('projects')}>Projects</button>
        </nav>
      </div>

      <div className="sidebar-section">
        <h4>Recent</h4>
        {recentProjects.length === 0 ? <div className="muted">No recent</div> : recentProjects.map(p => <ProjectItem key={p.id} p={p} openProject={openProject} />)}
      </div>

      <div className="sidebar-section">
        <h4>Starred</h4>
        {starredProjects.length === 0 ? <div className="muted">No starred</div> : starredProjects.map(p => <ProjectItem key={p.id} p={p} openProject={openProject} />)}
      </div>

      <div className="sidebar-section">
        <h4>All Projects</h4>
        <div className="projects-list">
          {projects.map(p => (
            <div key={p.id} className="small-item project-row">
              <a href="#" onClick={e => { e.preventDefault(); openProject(p); }}>{p.name}</a>
              <div className="proj-meta muted">{p.ownerId ? `Owner: ${p.ownerId}` : ''}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
