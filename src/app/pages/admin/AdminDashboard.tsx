import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Users, FolderKanban, CheckCircle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from "../../config/baseApi";
export default function AdminDashboard() {
  const { users, projects, tasks } = useData();

  const activeUsers = users.filter(u => u.isActive).length;
  const activeProjects = projects.filter(p => !p.isArchived).length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;

  const projectsByMethodology = [
    { name: 'Agile', count: projects.filter(p => p.methodology === 'agile').length },
    { name: 'Kanban', count: projects.filter(p => p.methodology === 'kanban').length },
    { name: 'Waterfall', count: projects.filter(p => p.methodology === 'waterfall').length },
  ];

  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      active: activeUsers,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Active Projects',
      value: activeProjects,
      icon: FolderKanban,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Tasks',
      value: totalTasks,
      active: completedTasks,
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'System Health',
      value: '98%',
      icon: Activity,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
              {stat.active !== undefined && (
                <p className="text-sm text-gray-500 mt-1">{stat.active} active</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Projects by Methodology</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectsByMethodology}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">New project created</p>
                <p className="text-sm text-gray-600">Website Redesign - 2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">User registered</p>
                <p className="text-sm text-gray-600">jane@demo.com - 5 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">Task completed</p>
                <p className="text-sm text-gray-600">Setup project repository - 1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mt-6 bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Methodology</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.slice(0, 5).map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600">{project.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full capitalize bg-blue-100 text-blue-600">
                        {project.methodology}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{projectTasks.length}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(project.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
