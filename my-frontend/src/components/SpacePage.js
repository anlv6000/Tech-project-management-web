import React, { useState } from 'react';
import JiraBoard from './JiraBoard';
import IssueModal from './IssueModal';

export default function SpacePage({ project, updateProject, api }) {
  const [proj, setProj] = useState(project);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  function onTaskAdded(task) {
    const updated = { ...proj, tasks: [ ...(proj.tasks||[]), task ] };
    setProj(updated); updateProject(updated);
  }

  function onTaskUpdated(task) {
    const updated = { ...proj, tasks: (proj.tasks||[]).map(t => (String(t.id) === String(task.id)) ? { ...t, ...task } : t) };
    setProj(updated); updateProject(updated);
  }

  function openTask(task) { setActiveTask(task); setModalOpen(true); }

  function saveFromModal(task) { onTaskUpdated(task); }

  return (
    <div className="space-page">
      <div className="space-header">
        <div className="space-title">
          <h2>{proj.name}</h2>
          <div className="muted">{proj.description}</div>
        </div>
      </div>

      <JiraBoard tasks={proj.tasks || []} onAdd={onTaskAdded} onUpdate={onTaskUpdated} onOpen={openTask} />

      <IssueModal open={modalOpen} task={activeTask} onClose={() => setModalOpen(false)} onSave={saveFromModal} />
    </div>
  );
}
