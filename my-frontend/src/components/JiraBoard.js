import React, { useState } from 'react';

const COLUMNS = ['TO DO','IN PROGRESS','IN REVIEW','DONE'];

export default function JiraBoard({ tasks, onAdd, onUpdate, onOpen }) {
  const [title, setTitle] = useState('');

  function add() {
    if (!title) return; onAdd({ title, description: '', status: 'TO DO' }); setTitle('');
  }

  function move(task, dir) {
    const idx = COLUMNS.indexOf(task.status||'TO DO');
    const n = Math.max(0, Math.min(COLUMNS.length-1, idx + dir));
    const updated = { ...task, status: COLUMNS[n] };
    onUpdate(updated);
  }

  return (
    <div>
      <div style={{marginBottom:12,display:'flex',gap:8}}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="New task title" style={{flex:1,padding:8}} />
        <button onClick={add}>Add</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {COLUMNS.map(col => (
          <div key={col} style={{background:'#f9f9f9',padding:8,borderRadius:6,minHeight:200}}>
            <h4 style={{marginTop:0}}>{col}</h4>
            {(tasks||[]).filter(t => (t.status||'TO DO') === col).map(t => (
              <div key={t.id} style={{padding:8,background:'#fff',border:'1px solid #eee',marginBottom:8,borderRadius:4}}>
                <div style={{fontWeight:600}}>{t.title}</div>
                <div style={{fontSize:12,color:'#666'}}>{t.description}</div>
                <div style={{marginTop:6,display:'flex',gap:6}}>
                  <button onClick={()=>move(t,-1)} disabled={col==='TO DO'}>◀</button>
                  <button onClick={()=>move(t,1)} disabled={col==='DONE'}>▶</button>
                  <button onClick={()=>onOpen(t)}>Open</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
