import React, { useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type MonthlyActivityItem = {
  month: string;
  projects: number;
  tasks: number;
  users: number;
  actions: number;
};

export default function SystemReports() {
  const { projects, tasks, users, auditLogs, addAuditLog } = useData();

  const projectsByMethodology = useMemo(
    () => [
      {
        name: "Agile",
        value: projects.filter((p) => p.methodology === "agile").length,
        color: "#3b82f6",
      },
      {
        name: "Kanban",
        value: projects.filter((p) => p.methodology === "kanban").length,
        color: "#10b981",
      },
      {
        name: "Waterfall",
        value: projects.filter((p) => p.methodology === "waterfall").length,
        color: "#8b5cf6",
      },
    ],
    [projects],
  );

  const taskStatusData = useMemo(
    () =>
      [
        {
          name: "To Do",
          value: tasks.filter((t) => t.status === "todo").length,
          color: "#94a3b8",
        },
        {
          name: "In Progress",
          value: tasks.filter((t) => t.status === "in-progress").length,
          color: "#f59e0b",
        },
        {
          name: "Done",
          value: tasks.filter((t) => t.status === "done").length,
          color: "#10b981",
        },
        {
          name: "Backlog",
          value: tasks.filter((t) => t.status === "backlog").length,
          color: "#6366f1",
        },
      ].filter((item) => item.value > 0),
    [tasks],
  );

  const activityData = useMemo<MonthlyActivityItem[]>(() => {
    const now = new Date();
    const months: MonthlyActivityItem[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({
        month: d.toLocaleString("en-US", { month: "short" }),
        projects: 0,
        tasks: 0,
        users: 0,
        actions: 0,
      });
    }

    const monthIndexMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthIndexMap.set(`${d.getFullYear()}-${d.getMonth()}`, 5 - i);
    }

    projects.forEach((project) => {
      if (!project.createdAt) return;
      const date = new Date(project.createdAt);
      const index = monthIndexMap.get(
        `${date.getFullYear()}-${date.getMonth()}`,
      );
      if (index !== undefined) months[index].projects += 1;
    });

    tasks.forEach((task) => {
      if (!task.createdAt) return;
      const date = new Date(task.createdAt);
      const index = monthIndexMap.get(
        `${date.getFullYear()}-${date.getMonth()}`,
      );
      if (index !== undefined) months[index].tasks += 1;
    });

    users.forEach((user) => {
      if (!user.createdAt) return;
      const date = new Date(user.createdAt);
      const index = monthIndexMap.get(
        `${date.getFullYear()}-${date.getMonth()}`,
      );
      if (index !== undefined) months[index].users += 1;
    });

    auditLogs.forEach((log: any) => {
      const rawDate = log.createdAt || log.timestamp;
      if (!rawDate) return;
      const date = new Date(rawDate);
      const index = monthIndexMap.get(
        `${date.getFullYear()}-${date.getMonth()}`,
      );
      if (index !== undefined) months[index].actions += 1;
    });

    return months;
  }, [projects, tasks, users, auditLogs]);

  const totalTimeLogged = tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const avgTasksPerProject =
    projects.length > 0 ? (tasks.length / projects.length).toFixed(1) : "0.0";

  const completionRate =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.status === "done").length / tasks.length) *
            100,
        )
      : 0;

  const activeUsers = users.filter((u) => u.isActive).length;

  const totalActions = auditLogs.length;

  const handleExportSummary = async () => {
    const summary = [
      ["Metric", "Value"],
      ["Total Projects", projects.length],
      ["Total Tasks", tasks.length],
      ["Total Users", users.length],
      ["Active Users", activeUsers],
      ["Completion Rate", `${completionRate}%`],
      ["Audit Actions", totalActions],
      ["Total Time Logged", `${totalTimeLogged}h`],
      ["Average Tasks Per Project", avgTasksPerProject],
    ];

    const csv = summary
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    await addAuditLog(
      "export",
      "report",
      "system-reports",
      "Exported system report summary to CSV",
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            System Reports
          </h1>
          <p className="text-gray-600">
            Global statistics and analytics from database
          </p>
        </div>
        <button
          onClick={handleExportSummary}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          Export Summary
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Total Time Logged</p>
          <p className="text-3xl font-bold text-purple-600">
            {totalTimeLogged}h
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Avg Tasks/Project</p>
          <p className="text-3xl font-bold text-blue-600">
            {avgTasksPerProject}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Completion Rate</p>
          <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Active Users</p>
          <p className="text-3xl font-bold text-orange-600">{activeUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Audit Actions</p>
          <p className="text-3xl font-bold text-red-600">{totalActions}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Projects by Methodology
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectsByMethodology}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                dataKey="value"
              >
                {projectsByMethodology.map((entry, index) => (
                  <Cell key={`methodology-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Task Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`status-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Activity Trend (Last 6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="projects"
              stroke="#8b5cf6"
              name="Projects"
            />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="#3b82f6"
              name="Tasks"
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#10b981"
              name="Users"
            />
            <Line
              type="monotone"
              dataKey="actions"
              stroke="#ef4444"
              name="Audit Actions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
