import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Archive, Search, Users } from 'lucide-react';

export default function ProjectManagement() {

  const { projects, updateProject, getProjectMembers, getTasksByProject, users } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
const [selectedTask, setSelectedTask] = useState<any>(null);
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleArchive = (projectId: string, currentStatus: boolean) => {
    updateProject(projectId, { isArchived: !currentStatus });
  };

  const getMembersWithUser = (projectId: string) => {

    const members = getProjectMembers(projectId);

    return members.map((pm: any) => {
      const user = users.find((u: any) =>
        (u.id || u._id) === pm.userId
      );

      return {
        ...user,
        role: pm.role
      };
    }).filter(Boolean);
  };

  const getParentTasks = (projectId: string) => {
    return getTasksByProject(projectId).filter((t: any) => t.type !== 'subtask');
  };

  const getSubTasksByParent = (projectId: string, parentId: string) => {
    return getTasksByProject(projectId).filter(
      (t: any) => t.type === 'subtask' && String(t.parentId || '').trim() === String(parentId).trim()
    );
  };

  return (

    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Project Management
        </h1>

        <p className="text-gray-600">
          Manage all projects across the system
        </p>

      </div>

      {/* SEARCH */}

      <div className="bg-white p-4 rounded-lg border mb-6">

        <div className="relative max-w-md">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />

        </div>

      </div>

      {/* STATS */}

      <div className="grid md:grid-cols-4 gap-6 mb-6">

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Total Projects</p>
          <p className="text-3xl font-bold text-gray-900">
            {projects.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Agile</p>
          <p className="text-3xl font-bold text-blue-600">
            {projects.filter(p => p.methodology === 'agile').length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Kanban</p>
          <p className="text-3xl font-bold text-green-600">
            {projects.filter(p => p.methodology === 'kanban').length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Waterfall</p>
          <p className="text-3xl font-bold text-purple-600">
            {projects.filter(p => p.methodology === 'waterfall').length}
          </p>
        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-lg border">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Project
                </th>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Methodology
                </th>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Members
                </th>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Tasks
                </th>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Created
                </th>

                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y">

              {filteredProjects.map(project => {

                const projectId = (project.id || project._id)!;

                const members = getMembersWithUser(projectId);

                const tasks = getTasksByProject(projectId);

                return (

                  <tr
                    key={projectId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >

                    <td className="px-6 py-4">

                      <p className="font-medium text-gray-900">
                        {project.name}
                      </p>

                      <p className="text-sm text-gray-600 line-clamp-1">
                        {project.description}
                      </p>

                    </td>

                    <td className="px-6 py-4">

                      <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600 capitalize">
                        {project.methodology}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-1 text-gray-600">

                        <Users className="w-4 h-4"/>

                        {members.length}

                      </div>

                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {tasks.length}
                    </td>

                    <td className="px-6 py-4">

                      <span className={`px-3 py-1 text-xs rounded-full ${
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(projectId, project.isArchived);
                        }}
                        className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 flex items-center gap-1 ml-auto"
                      >

                        <Archive className="w-4 h-4"/>

                        {project.isArchived ? 'Restore' : 'Archive'}

                      </button>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>

      {/* SIDE PANEL */}

      {selectedProject && (

        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedProject(null)}
        >

          <div className="flex-1 bg-black/30"></div>

          <div
            className="w-[400px] bg-white h-full border-l shadow-lg p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-lg font-bold">
                Project Details
              </h2>

              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>

            </div>

            <h3 className="text-xl font-semibold mb-2">
              {selectedProject.name}
            </h3>

            <p className="text-gray-600 mb-6">
              {selectedProject.description}
            </p>

            <div className="space-y-2 text-sm mb-6">

              <p>
                <b>Methodology:</b> {selectedProject.methodology}
              </p>

              <p>
                <b>Created:</b> {new Date(selectedProject.createdAt).toLocaleDateString()}
              </p>

            </div>
{selectedTask && (

  <div
    className="fixed inset-0 z-[60] flex"
    onClick={() => setSelectedTask(null)}
  >

    <div className="flex-1 bg-black/40"></div>

    <div
      className="w-[420px] bg-white h-full border-l shadow-xl p-6 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >

      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-lg font-bold">
          Task Details
        </h2>

        <button
          onClick={() => setSelectedTask(null)}
          className="text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>

      </div>

      {/* TITLE */}

      <h3 className="text-xl font-semibold mb-3">
        {selectedTask.title}
      </h3>

      {/* STATUS + PRIORITY */}

      <div className="flex gap-2 mb-5">

        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600 capitalize">
          {selectedTask.status}
        </span>

        <span className={`px-3 py-1 text-xs rounded-full capitalize ${
          selectedTask.priority === "high"
            ? "bg-red-100 text-red-600"
            : selectedTask.priority === "medium"
            ? "bg-yellow-100 text-yellow-600"
            : "bg-green-100 text-green-600"
        }`}>
          {selectedTask.priority} priority
        </span>

      </div>

      {/* ASSIGNEE */}

      <div className="mb-5">

        <p className="text-sm font-semibold mb-2">
          Assignee
        </p>

        {(() => {
          const rawAssignee =
            selectedTask.assigneeId ||
            (selectedTask as any).assignee ||
            null;

          let assigneeName = "Unassigned";

          if (rawAssignee) {
            if (typeof rawAssignee === "object") {
              assigneeName = rawAssignee.fullName || "Unassigned";
            } else {
              const matchedUser = users.find((u: any) =>
                String(u.id || u._id) === String(rawAssignee),
              );
              assigneeName = matchedUser?.fullName || String(rawAssignee);
            }
          }

          return (
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-semibold">
                {assigneeName && assigneeName !== "Unassigned"
                  ? assigneeName.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <span className="text-sm text-gray-800">
                {assigneeName || "Unassigned"}
              </span>
            </div>
          );
        })()}

      </div>

      {/* DESCRIPTION */}

      <div className="mb-5">

        <p className="text-sm font-semibold mb-2">
          Description
        </p>

        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 min-h-[80px]">
          {selectedTask.description || "No description provided"}
        </div>

      </div>

      {/* INFO */}

      <div className="space-y-3 text-sm">

        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">Task ID</span>
          <span className="font-medium">
            {selectedTask.id || selectedTask._id}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">Created</span>
          <span>
            {selectedTask.createdAt
              ? new Date(selectedTask.createdAt).toLocaleDateString()
              : "N/A"}
          </span>
        </div>

      </div>

    </div>

  </div>

)}
            {/* MEMBERS */}

            <div className="mb-6">

              <p className="font-semibold mb-3">
                Members
              </p>

              <div className="flex flex-wrap gap-2">

                {getMembersWithUser(selectedProject.id || selectedProject._id).map((m: any) => (

                  <div
                    key={m.id || m._id}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                  >

                    <div className="w-6 h-6 bg-purple-500 text-white text-xs flex items-center justify-center rounded-full">
                      {m.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <span className="text-sm">
                      {m.fullName}
                    </span>

                    <span className="text-xs text-gray-500">
                      {m.role}
                    </span>

                  </div>

                ))}

              </div>

            </div>

            {/* TASKS */}

            <div>

              <p className="font-semibold mb-2">
                Tasks
              </p>

              <ul className="space-y-1 text-sm">

                {getParentTasks(selectedProject.id || selectedProject._id).map((t: any) => {
                  const subTasks = getSubTasksByParent(selectedProject.id || selectedProject._id, t.id || t._id);
                  return (
                    <li key={t.id || t._id}>
                      <button
                        onClick={() => setSelectedTask(t)}
                        className="w-full text-left bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                      >
                        {t.title}
                      </button>

                      {subTasks.length > 0 && (
                        <ul className="mt-1 ml-4 space-y-1">
                          {subTasks.map((sub: any) => (
                            <li
                              key={sub.id || sub._id}
                              onClick={() => setSelectedTask(sub)}
                              className="bg-gray-50 px-2 py-1 rounded cursor-pointer hover:bg-gray-100"
                            >
                              {sub.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}

              </ul>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}