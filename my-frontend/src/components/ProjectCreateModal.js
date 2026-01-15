import React, { useState } from 'react';

export default function ProjectCreateModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  if (!open) return null;
  function submit(e) { e.preventDefault(); onCreate && onCreate({ name, description }); onClose && onClose(); }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3>Create project</h3><button className="close" onClick={onClose}>✕</button></div>
        <form className="modal-body" onSubmit={submit}>
          <label>Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} required />
          <label>Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} />
          <div className="modal-footer">
            <button type="button" className="btn muted" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
