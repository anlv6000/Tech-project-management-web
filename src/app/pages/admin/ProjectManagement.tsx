import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { FolderKanban, Archive, Search, Users } from 'lucide-react';

export default function ProjectManagement() {
  const { projects, updateProject, getProjectMembers, getTasksByProject } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleArchive = (projectId: string, currentStatus: boolean) => {
    updateProject(projectId, { isArchived: !currentStatus });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Management</h1>
        <p className="text-gray-600">Manage all projects across the system</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Total Projects</p>
          <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Agile</p>
          <p className="text-3xl font-bold text-blue-600">{projects.filter(p => p.methodology === 'agile').length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Kanban</p>
          <p className="text-3xl font-bold text-green-600">{projects.filter(p => p.methodology === 'kanban').length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Waterfall</p>
          <p className="text-3xl font-bold text-purple-600">{projects.filter(p => p.methodology === 'waterfall').length}</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Methodology</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.map(project => {
                const projectId = (project.id || project._id)!;
                const members = getProjectMembers(projectId);
                const tasks = getTasksByProject(projectId);
                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{project.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full capitalize bg-blue-100 text-blue-600">
                        {project.methodology}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{members.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{tasks.length}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        project.isArchived 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {project.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleArchive(projectId, project.isArchived)}
                        className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ml-auto ${
                          project.isArchived
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Archive className="w-4 h-4" />
                        {project.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProjects.length === 0 && (
          <div className="p-12 text-center">
            <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No projects found</p>
          </div>
        )}
      </div>
    </div>
  );
}
