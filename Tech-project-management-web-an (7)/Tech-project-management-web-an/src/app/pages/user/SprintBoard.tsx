import React, { useState } from "react";
import axios from "axios";

export default function CreateTask({ projectId, sprintId, onCreated }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");

  // 👉 lấy ngày hôm nay (yyyy-mm-dd)
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const today = new Date().setHours(0, 0, 0, 0);
    const selectedStart = new Date(startDate).setHours(0, 0, 0, 0);

    // ❌ validate start date
    if (selectedStart < today) {
      alert("Start date phải từ hôm nay trở đi!");
      return;
    }

    // ❌ validate deadline
    if (deadline && new Date(deadline) < new Date(startDate)) {
      alert("Deadline phải sau start date!");
      return;
    }

    try {
      await axios.post("/tasks", {
        title,
        startDate,
        deadline,
        projectId,
        sprintId,
      });

      alert("Tạo task thành công!");
      setTitle("");
      setStartDate("");
      setDeadline("");

      if (onCreated) onCreated(); // reload list
    } catch (err) {
      alert(err.response?.data?.message || "Create failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20, background: "#fff" }}>
      <h3>Create Task</h3>

      {/* Title */}
      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Start Date */}
      <div>
        <label>Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          min={getToday()} // ✅ CHẶN NGÀY QUÁ KHỨ
          required
        />
      </div>

      {/* Deadline */}
      <div>
        <label>Deadline:</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={startDate || getToday()} // ✅ >= startDate
        />
      </div>

      <button type="submit">Create</button>
    </form>
  );
}