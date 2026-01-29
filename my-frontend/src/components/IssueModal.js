import React, { useState, useEffect } from 'react';

export default function IssueModal({ open, task, onClose, onSave }) {
  const [draft, setDraft] = useState(null);
  useEffect(()=>{ setDraft(task?{...task}:null); },[task]);
  if (!open || !draft) return null;
  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}>
      <div style={{width:560,background:'#fff',padding:16,borderRadius:6}}>
        <h3 style={{marginTop:0}}>Task</h3>
        <input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
        <textarea value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label>Status:</label>
          <select value={draft.status||'TO DO'} onChange={e=>setDraft({...draft,status:e.target.value})}>
            <option>TO DO</option>
            <option>IN PROGRESS</option>
            <option>IN REVIEW</option>
            <option>DONE</option>
          </select>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={()=>onSave(draft)}>Save</button>
        </div>
      </div>
    </div>
  );
}
