import React from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { FolderKanban, ListTodo, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Task } from '../../types';
import { API_BASE_URL } from "../../config/baseApi";
export default function Dashboard() {
  const { user } = useAuth();
  const { getUserProjects, tasks, getTasksByProject, getUserNotifications } = useData();

  if (!user) return null;

  const userId = user.id || user._id || '';
  const userProjects = getUserProjects(userId);
  const userTasks = tasks.filter((t: Task) => {
    if (typeof t.assigneeId === "string") {
      return t.assigneeId === userId;
    }
    if (typeof t.assigneeId === "object" && t.assigneeId?._id) {
      return t.assigneeId._id === userId;
    }
    return false;
  });
  const inProgressTasks = userTasks.filter(t => t.status === 'in-progress');
  const completedTasks = userTasks.filter(t => t.status === 'done');

  // Get recent activity from notifications
  const notifications = getUserNotifications(userId);
  const recentActivity = notifications.slice(0, 3).map((notif, index) => ({
    id: notif.id || notif._id || index.toString(),
    action: 'Notification',
    item: notif.message.substring(0, 30) + (notif.message.length > 30 ? '...' : ''),
    time: new Date(notif.createdAt).toLocaleDateString(),
    project: 'Recent',
  }));

  const stats = [
    {
      label: 'Active Projects',
      value: userProjects.length,
      icon: FolderKanban,
      color: 'bg-blue-100 text-blue-600',
      link: '/app/projects',
    },
    {
      label: 'Total Tasks',
      value: userTasks.length,
      icon: ListTodo,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'In Progress',
      value: inProgressTasks.length,
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Completed',
      value: completedTasks.length,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.fullName}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats */}
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
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Active Projects</h2>
            <Link to="/app/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="p-6">
            {userProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No projects yet</p>
                <Link to="/app/projects">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create Project
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userProjects.slice(0, 3).map((project) => {
                  const projectId = (project.id || project._id)!;
                  const projectTasks = getTasksByProject(projectId);
                  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                  const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

                  return (
                    <Link
                      key={projectId}
                      to={`/app/projects/${projectId}`}
                      className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{project.methodology}</p>
                        </div>
                        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                        <span>{projectTasks.length} tasks</span>
                        <span>Due {new Date(project.endDate).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      {activity.action}{' '}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">{activity.project}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/app/projects"
            className="flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <span className="font-medium">View Projects</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/app/reports"
            className="flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <span className="font-medium">View Reports</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/app/profile"
            className="flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <span className="font-medium">Edit Profile</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
