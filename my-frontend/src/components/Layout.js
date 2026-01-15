import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ user, onLogout, projects, openProject, setView, view, onCreateClick, children }) {
  return (
    <div className="layout">
      <Sidebar projects={projects} openProject={openProject} setView={setView} view={view} />
      <div className="main">
        <Topbar user={user} onLogout={onLogout} setView={setView} onCreateClick={onCreateClick} />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}
