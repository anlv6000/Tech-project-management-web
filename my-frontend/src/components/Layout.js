import React from 'react';

export default function Layout({ user, onLogout, projects, openProject, onCreateClick, children, setView, view, onProfileClick }) {
  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <aside style={{width:240,background:'#f7f7f7',padding:16,borderRight:'1px solid #eee'}}>
        <div style={{marginBottom:12}}>
          <strong>TPM</strong>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontWeight:600}}>{user?.name || 'Guest'}</div>
          <div style={{fontSize:12,color:'#666'}}>{user?.role}</div>
        </div>
        <div style={{marginBottom:12}}>
          <button onClick={()=>setView('home')} style={{width:'100%',padding:8,marginBottom:6}}>Home</button>
          <button onClick={()=>setView('projects')} style={{width:'100%',padding:8}}>Projects</button>
        </div>
        <div style={{marginTop:12}}>
          <button onClick={onCreateClick} style={{width:'100%',padding:8}}>Create Project</button>
        </div>
        <hr />
        <div>
          <div style={{fontSize:12,color:'#666',marginBottom:6}}>Projects</div>
          <ul style={{padding:0,listStyle:'none'}}>
            {projects.map(p => (
              <li key={p.id} style={{marginBottom:6}}>
                <a href="#" onClick={e=>{e.preventDefault(); openProject(p);}}>{p.name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div style={{position:'absolute',bottom:16,left:16,right:16}}>
          <button onClick={onLogout} style={{width:'100%',padding:8}}>Logout</button>
        </div>
      </aside>
      <main style={{flex:1,padding:20}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h1 style={{margin:0}}>{view==='space'? 'Space' : 'Tech Project Management'}</h1>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{fontSize:14,color:'#333'}}>Welcome {user?.name}</div>
              <button onClick={onProfileClick} style={{padding:'6px 10px'}}>Profile</button>
            </div>
        </header>
        <div>{children}</div>
      </main>
    </div>
  );
}
