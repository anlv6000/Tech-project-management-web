import React from 'react';

export default function Topbar({ user, onLogout, setView, onCreateClick }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="brand">Tech PM</h1>
        <div className="search">
          <input placeholder="Search issues, projects..." />
        </div>
      </div>
      <div className="topbar-right">
        <button onClick={() => setView('projects')} className="ghost">Projects</button>
        <button className="ghost" onClick={() => onCreateClick && onCreateClick()}>Create</button>
        <div className="user">
          <span className="avatar">{(user?.name||'U').split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
          <span className="username">{user?.name}</span>
          <button className="link" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
