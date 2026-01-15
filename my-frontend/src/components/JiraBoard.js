import React, { useState, useEffect } from 'react';

const COLUMNS = ['TO DO', 'IN PROGRESS', 'IN REVIEW', 'DONE'];

function TaskCard({ task, onClick, draggable }) {
  return (
    <div className="task-card" draggable={draggable} onClick={() => onClick && onClick(task)} data-id={task.id}>
      <div className="task-top">
        <div className="task-title">{task.title}</div>
        <div className="task-badge">{(task.assigneeId) ? '👤' : ''}</div>
      </div>
      <div className="task-meta muted">{task.description}</div>
    </div>
  );
}

export default function JiraBoard({ tasks, onAdd, onUpdate, onOpen }) {
  const [title, setTitle] = useState('');
  const [dragData, setDragData] = useState(null);

  useEffect(() => { setTitle(''); }, [tasks]);

  function addTask(e) {
    e.preventDefault();
    if (!title) return;
    const t = { id: 't_' + Date.now(), title, status: 'TO DO', description: '' };
    onAdd && onAdd(t);
    setTitle('');
  }

  function handleDragStart(e, task) {
    setDragData(task);
    e.dataTransfer.setData('text/plain', task.id);
  }

  function handleDrop(e, col) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => String(t.id) === String(id));
    if (task) onUpdate && onUpdate({ ...task, status: col });
    setDragData(null);
  }

  return (
    <div className="board">
      <form className="add-task" onSubmit={addTask}>
        <input placeholder="New task title" value={title} onChange={e=>setTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <div className="board-columns">
        {COLUMNS.map(col => (
          <div className="board-column" key={col} onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e, col)}>
            <div className="col-header">{col}</div>
            <div className="col-list">
              {tasks.filter(t => (t.status||'').toUpperCase() === col).map(t => (
                <div key={t.id} onDragStart={(e)=>handleDragStart(e,t)} draggable>
                  <TaskCard task={t} onClick={onOpen} draggable />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
