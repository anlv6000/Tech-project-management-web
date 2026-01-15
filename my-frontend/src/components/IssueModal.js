import React, { useState } from 'react';

export default function IssueModal({ open, task, onClose, onSave }) {
  const [draft, setDraft] = useState(task || {});

  if (!open) return null;

  function handleChange(k, v) { setDraft({ ...draft, [k]: v }); }

  function save() { onSave && onSave(draft); onClose && onClose(); }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Issue: {draft.title || 'New issue'}</h3>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label>Title</label>
          <input value={draft.title||''} onChange={e=>handleChange('title', e.target.value)} />
          <label>Description</label>
          <textarea value={draft.description||''} onChange={e=>handleChange('description', e.target.value)} />
          <label>Status</label>
          <select value={draft.status||'TO DO'} onChange={e=>handleChange('status', e.target.value)}>
            <option>TO DO</option>
            <option>IN PROGRESS</option>
            <option>IN REVIEW</option>
            <option>DONE</option>
          </select>
          <label>Assignee (user id)</label>
          <input value={draft.assigneeId||''} onChange={e=>handleChange('assigneeId', e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn muted" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
