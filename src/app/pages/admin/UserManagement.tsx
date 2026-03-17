import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { UserX, UserCheck, Search } from 'lucide-react';

export default function UserManagement() {

  const {
    getAllUsers,
    updateUserData,
    userProjects,
    projects,
    getProject,
    getProjectMembers,
    getTasksByProject,
    resetUserPassword,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const users = getAllUsers();

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    updateUserData(userId, { isActive: !currentStatus });
  };

  const getUserProjects = (userId: string) => {
    const projectIds = userProjects
      .filter(up => up.userId === userId)
      .map(up => up.projectId)
      .filter((id): id is string => id !== undefined);

    return projects.filter(p => {
      const pId = p.id || p._id;
      return pId && projectIds.includes(pId);
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Manage system users and their access
        </p>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">
            {users.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Active Users</p>
          <p className="text-3xl font-bold text-green-600">
            {users.filter(u => u.isActive).length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Administrators</p>
          <p className="text-3xl font-bold text-purple-600">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>

      </div>

      {/* USER TABLE */}

      <div className="bg-white rounded-lg border">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Projects
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>

                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-200">

              {filteredUsers.map(user => {

                const userId = user.id || user._id || '';
                const userProjectsList = getUserProjects(userId);

                return (

                  <tr
                    key={userId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">

                          <span className="text-purple-600 font-medium">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>

                        </div>

                        <div>

                          <p className="font-medium text-gray-900">
                            {user.fullName}
                          </p>

                          <p className="text-sm text-gray-600">
                            {user.email}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-6 py-4">

                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full capitalize ${user.role === 'admin'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-blue-100 text-blue-600'
                        }`}>
                        {user.role}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {userProjectsList.length}
                    </td>

                    <td className="px-6 py-4">

                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${user.isActive
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                        }`}>

                        {user.isActive
                          ? <UserCheck className="w-3 h-3" />
                          : <UserX className="w-3 h-3" />
                        }

                        {user.isActive ? 'Active' : 'Inactive'}

                      </span>

                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(userId, user.isActive);
                        }}
                        className={`px-3 py-1 text-sm rounded-lg ${user.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                          }`}
                      >

                        {user.isActive ? 'Deactivate' : 'Activate'}

                      </button>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>

      {/* OVERLAY + SIDE PANEL */}

      {selectedUser && (

        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedUser(null)}
        >

          {/* DARK BACKGROUND */}
          <div className="flex-1 bg-black/30"></div>

          {/* PANEL */}
          <div
            className="w-[380px] h-full bg-white border-l shadow-lg p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex justify-between items-center mb-6">

              

              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>

            </div>

            <div className="flex items-center gap-3 mb-6">

              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">

                {selectedUser.fullName.charAt(0).toUpperCase()}

              </div>

              <div>

                <p className="font-semibold">
                  {selectedUser.fullName}
                </p>

                <p className="text-sm text-gray-500">
                  {selectedUser.email}
                </p>

              </div>

            </div>

            <div className="space-y-3 text-sm mb-6">

              <p>
                <b>Role:</b> {selectedUser.role}
              </p>

              <p>
                <b>Status:</b> {selectedUser.isActive ? "Active" : "Inactive"}
              </p>

              <p>
                <b>Joined:</b>{" "}
                {new Date(selectedUser.createdAt).toLocaleDateString()}
              </p>

            </div>

            <div className="mb-6">

              <p className="font-semibold mb-2">
                Projects
              </p>

              <ul className="text-sm space-y-1">

                {getUserProjects(selectedUser.id || selectedUser._id).map(p => (

                  <li
                    key={p.id || p._id}
                    onClick={() => setSelectedProjectId(p.id || p._id || null)}
                    className={`bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 ${
                      selectedProjectId === (p.id || p._id) ? 'bg-purple-100 border border-purple-300' : ''
                    }`}
                  >
                    {p.name}
                  </li>

                ))}

              </ul>

            </div>

            {selectedProjectId && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
                {(() => {
                  const project = getProject(selectedProjectId);
                  if (!project) return <p className="text-sm text-gray-500">Project not found</p>;

                  const projectMembers = getProjectMembers(selectedProjectId);
                  const tasks = getTasksByProject(selectedProjectId);
                  const doneTasks = tasks.filter((t: any) => t.status === 'done').length;
                  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

                  return (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">Project Detail</p>
                        <button
                          onClick={() => setSelectedProjectId(null)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Close
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                      <p className="text-xs text-gray-500 mb-2">Methodology: {project.methodology}</p>

                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-700">
                        <div>Members: {projectMembers.length}</div>
                        <div>Tasks: {tasks.length}</div>
                        <div>Status: {project.isCompleted ? 'Completed' : 'Active'}</div>
                        <div>Progress: {progress}%</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

          
            <div className="mt-6">
              <p className="font-semibold mb-2">Reset Password</p>
              <input
                type="password"
                placeholder="New password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <button
                onClick={async () => {
                  try {
                    await resetUserPassword(selectedUser.id || selectedUser._id, resetPassword);
                    alert("Password reset successfully!");
                    setResetPassword('');
                  } catch {
                    alert("Failed to reset password");
                  }
                }}
                className="w-full py-2 bg-blue-600 text-white rounded"
              >
                Reset Password
              </button>
            </div>

          </div>

        </div>

      )}

    </div>
  );
}