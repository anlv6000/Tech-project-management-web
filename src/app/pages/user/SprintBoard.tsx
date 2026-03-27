import React, { useEffect, useState } from "react";
import axios from "axios";

const columns = ["todo", "in-progress", "review", "done", "blocked"];

export default function SprintBoard({ projectId, sprintId }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, [projectId, sprintId]);

  const fetchTasks = async () => {
    const res = await axios.get(`/tasks/project/${projectId}`);
    setTasks(res.data);
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`/tasks/${taskId}`, { agileStatus: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const sprintTasks = tasks.filter((t) => t.sprintId === sprintId);

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {columns.map((col) => (
        <div key={col} style={{ flex: 1, background: "#f4f5f7", padding: 10 }}>
          <h4>{col}</h4>
          {sprintTasks
            .filter((t) => t.agileStatus === col)
            .map((task) => (
              <div
                key={task.id}
                style={{
                  background: "white",
                  padding: 8,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
                onClick={() => {
                  const next = prompt("Move to?", col);
                  if (next) updateStatus(task.id, next);
                }}
              >
                {task.title}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
