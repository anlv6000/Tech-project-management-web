import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Calendar,
  Users,
  BarChart3,
  Kanban,
  UserPlus,
  X,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const {
    getProject,
    getProjectMembers,
    getProjectWorkUnits,
    getTasksByProject,
    users,
    getAllUsers,
    addUserToProject,
    loadProjectData,
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'reports'>('overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  if (!projectId) return null;

  // Load project data on mount
  React.useEffect(() => {
    loadProjectData(projectId);
  }, [projectId]);

  const project = getProject(projectId);
  const members = getProjectMembers(projectId);
  const workUnits = getProjectWorkUnits(projectId);
  const tasks = getTasksByProject(projectId);
  const allUsers = getAllUsers();

  if (!project) {
    return (
      <div className="p-6">
        <p>Project not found</p>
      </div>
    );
  }

  const availableUsers = allUsers.filter(u => 
    !members.some(m => m.userId === u.id) && u.isActive
  );

  const handleAddMember = () => {
    if (selectedUserId) {
      addUserToProject(selectedUserId, projectId, 'member');
      setShowAddMember(false);
      setSelectedUserId('');
    }
  };

  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  // Chart data
  const taskStatusData = [
    { name: 'To Do', value: todoTasks, color: '#94a3b8' },
    { name: 'In Progress', value: inProgressTasks, color: '#f59e0b' },
    { name: 'Done', value: completedTasks, color: '#10b981' },
  ];

  const workUnitData = workUnits.map(wu => ({
    name: wu.name,
    tasks: tasks.filter(t => t.workUnitId === wu.id).length,
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto">
          <Link to="/app/projects" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex items-center gap-4">
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full capitalize bg-blue-100 text-blue-600">
                  {project.methodology}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <Link to={`/app/projects/${projectId}/board`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Kanban className="w-5 h-5" />
                Open Board
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Project Progress</h2>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Overall Completion</span>
                    <span className="font-bold text-gray-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{todoTasks}</p>
                    <p className="text-sm text-gray-600">To Do</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{inProgressTasks}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </div>

              {/* Work Units Timeline */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {project.methodology === 'agile' && 'Sprint Timeline'}
                  {project.methodology === 'kanban' && 'Workflow Columns'}
                  {project.methodology === 'waterfall' && 'Project Phases'}
                </h2>
                <div className="space-y-3">
                  {workUnits.map((wu) => {
                    const unitTasks = tasks.filter(t => t.workUnitId === wu.id);
                    const unitCompleted = unitTasks.filter(t => t.status === 'done').length;
                    const unitProgress = unitTasks.length > 0 ? (unitCompleted / unitTasks.length) * 100 : 0;

                    return (
                      <div key={wu.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">{wu.name}</h3>
                            {wu.goal && <p className="text-sm text-gray-600">{wu.goal}</p>}
                          </div>
                          <span className="text-sm text-gray-600">{unitTasks.length} tasks</span>
                        </div>
                        {wu.startDate && wu.endDate && (
                          <div className="text-sm text-gray-600 mb-2">
                            {new Date(wu.startDate).toLocaleDateString()} - {new Date(wu.endDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${unitProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Member
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {members.map((member) => {
                    const memberUser = allUsers.find(u => u.id === member.userId);
                    if (!memberUser) return null;

                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {memberUser.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{memberUser.fullName}</p>
                            <p className="text-sm text-gray-600">{memberUser.email}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-sm font-medium rounded-full capitalize bg-blue-100 text-blue-600">
                          {member.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Task Status Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Tasks by {project.methodology === 'agile' ? 'Sprint' : project.methodology === 'waterfall' ? 'Phase' : 'Column'}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workUnitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks" fill="#3b82f6" name="Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Team Member</h2>
              <button onClick={() => setShowAddMember(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              >
                <option value="">Choose a user...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!selectedUserId}
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
