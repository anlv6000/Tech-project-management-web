import React, { useState } from 'react';

export default function ProjectCreateModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  if (!open) return null;
  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}>
      <div style={{width:400,background:'#fff',padding:16,borderRadius:6}}>
        <h3 style={{marginTop:0}}>Create Project</h3>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
        <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={()=>{ if (!form.name) return alert('Name required'); onCreate({ name: form.name, description: form.description }); }}>Create</button>
        </div>
      </div>
    </div>
  );
}
