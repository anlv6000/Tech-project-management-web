import React, { useState } from 'react';
import api from '../api';

export default function ProfileModal({ open, user, onClose, onUpdate }) {
  const [form, setForm] = useState({ name: user?.name || '', password: '' });
  if (!open) return null;
  async function save() {
    try {
      const token = localStorage.getItem('token');
      const res = await api.updateUser(user.id || user._id, { name: form.name, password: form.password }, token);
      if (res) { onUpdate(res); onClose(); }
    } catch (err) { alert('Save failed'); }
  }
  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}>
      <div style={{width:420,background:'#fff',padding:16,borderRadius:6}}>
        <h3 style={{marginTop:0}}>Profile</h3>
        <div style={{marginBottom:8}}><label>Full name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:'100%',padding:8}} /></div>
        <div style={{marginBottom:8}}><label>New password</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{width:'100%',padding:8}} /></div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
