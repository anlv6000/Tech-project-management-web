import React, { useEffect, useState } from 'react';
import JiraBoard from './JiraBoard';
import IssueModal from './IssueModal';
import api from '../api';

export default function SpacePage({ project, updateProject }) {
  const [proj, setProj] = useState(project);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');

  useEffect(()=>{ setProj(project); },[project]);

  useEffect(()=>{ (async ()=>{
    const token = localStorage.getItem('token');
    if (!token) return;
    try { const u = await api.getUsers(token); if (Array.isArray(u)) setUsersList(u); } catch(err) { }
  })(); },[]);

  async function onTaskAdded(task) {
    // send to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.createTask(proj.id || proj._id, { title: task.title, description: task.description||'' }, token);
        if (res && (res._id || res.id)) {
          const t = { ...task, id: res._id || res.id };
          const updated = { ...proj, tasks: [ ...(proj.tasks||[]), t ] };
          setProj(updated); updateProject(updated);
          return;
        }
      } catch (err) { /* ignore */ }
    }
    const newId = `local-${Date.now()}`;
    const t = { ...task, id: newId };
    const updated = { ...proj, tasks: [ ...(proj.tasks||[]), t ] };
    setProj(updated); updateProject(updated);
  }

  async function onTaskUpdated(task) {
    const token = localStorage.getItem('token');
    if (token) {
      try { await api.patchTask(task.id, { status: task.status, title: task.title, description: task.description, assigneeId: task.assigneeId }, token); } catch (err) { console.error(err); }
    }
    const updated = { ...proj, tasks: (proj.tasks||[]).map(t => (String(t.id)===String(task.id))?{...t,...task}:t) };
    setProj(updated); updateProject(updated);
  }

  function openTask(task) { setActiveTask(task); setModalOpen(true); }

  function saveFromModal(task) { onTaskUpdated(task); setModalOpen(false); }

  async function handleAddMember() {
    const token = localStorage.getItem('token');
    if (!token) return alert('Login required');
    try {
      const res = await api.addProjectMember(proj.id || proj._id, { userId: selectedMember }, token);
      if (res) {
        // res returns members array
        const updated = { ...proj, members: res };
        setProj(updated); updateProject(updated);
        setAddingMember(false); setSelectedMember('');
      }
    } catch (err) { alert('Add failed'); }
  }

  async function handleRemoveMember(userId) {
    const token = localStorage.getItem('token');
    if (!token) return alert('Login required');
    try {
      const res = await api.removeProjectMember(proj.id || proj._id, userId, token);
      if (res) { const updated = { ...proj, members: res }; setProj(updated); updateProject(updated); }
    } catch (err) { alert('Remove failed'); }
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <h2 style={{margin:0}}>{proj.name}</h2>
          <div style={{color:'#666'}}>{proj.description}</div>
        </div>
      </div>
      <JiraBoard tasks={proj.tasks||[]} onAdd={onTaskAdded} onUpdate={onTaskUpdated} onOpen={openTask} />
      <div style={{marginTop:16,borderTop:'1px solid #eee',paddingTop:12}}>
        <h4>Members</h4>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {(proj.members||[]).map(m => (
            <div key={m.id || m._id || m} style={{padding:8,background:'#fff',border:'1px solid #eee',borderRadius:6,display:'flex',alignItems:'center',gap:8}}>
              <div style={{fontWeight:600}}>{m.name || m}</div>
              <div style={{fontSize:12,color:'#666'}}>{m.email || ''}</div>
              <button onClick={()=>handleRemoveMember(m.id || m._id || m)} style={{marginLeft:8}}>Remove</button>
            </div>
          ))}
        </div>
        {addingMember ? (
          <div style={{marginTop:8,display:'flex',gap:8,alignItems:'center'}}>
            <select value={selectedMember} onChange={e=>setSelectedMember(e.target.value)}>
              <option value="">Select user</option>
              {usersList.map(u => <option key={u.id || u._id} value={u.id || u._id}>{u.name} — {u.email}</option>)}
            </select>
            <button onClick={handleAddMember}>Add</button>
            <button onClick={()=>{ setAddingMember(false); setSelectedMember(''); }}>Cancel</button>
          </div>
        ) : (
          <div style={{marginTop:8}}><button onClick={()=>setAddingMember(true)}>Add member</button></div>
        )}
      </div>
      <IssueModal open={modalOpen} task={activeTask} onClose={()=>setModalOpen(false)} onSave={saveFromModal} />
    </div>
  );
}
