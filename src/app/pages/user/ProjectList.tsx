import React, { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/baseApi";
import { useData } from "../../contexts/DataContext";
import { useEffect } from "react";
import {
  Plus,
  Calendar,
  Users,
  TrendingUp,
  FolderKanban,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Methodology } from "../../types";
import { WorkUnit } from "../../types";

export default function ProjectList() {
  const { user } = useAuth();
  const {
    getUserProjects,
    createProject,
    getProjectMembers,
    getTasksByProject,
    createWorkUnit,
    refreshProjects,
  } = useData();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const todayDate = getTodayDate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    methodology: "agile" as Methodology,
    startDate: todayDate,
    endDate: "",
  });
  const [inviteData, setInviteData] = useState({
    searchInput: "",
    role: "member", // mặc định
  });

  // Dropdown chọn role
  <select
    value={inviteData.role}
    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
  >
    <option value="projectAdmin">Project Admin</option>
    <option value="projectManager">Project Manager</option>
    <option value="member">Member</option>
    <option value="viewer">Viewer</option>
  </select>;

  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);

  if (!user) return null;

  const userId = user.id || user._id || "";
  const projects = getUserProjects(userId);
  useEffect(() => {
    refreshProjects();
  }, []);
  const token = sessionStorage.getItem("token");
  const authJsonHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess(false);

    const todayDate = getTodayDate();

    // Validation
    if (!formData.name.trim()) {
      setCreateError("Project name is required");
      return;
    }

    if (!formData.description.trim()) {
      setCreateError("Project description is required");
      return;
    }

    if (formData.description.length > 200) {
      setCreateError("Description is too long (max 200 characters)");
      return;
    }

    if (formData.startDate !== todayDate) {
      setCreateError("Start date must be today");
      return;
    }

    if (!formData.endDate) {
      setCreateError("End date is required");
      return;
    }

    if (formData.endDate < todayDate) {
      setCreateError("End date cannot be in the past");
      return;
    }

    if (formData.endDate < formData.startDate) {
      setCreateError("End date cannot be earlier than start date");
      return;
    }

    // Check for unique project name
    const existingProject = projects.find(
      (project) =>
        project.name.trim().toLowerCase() ===
        formData.name.trim().toLowerCase(),
    );
    if (existingProject) {
      setCreateError("Project name must be unique");
      return;
    }

    setIsCreatingProject(true);

    try {
      const result = await createProject({
        name: formData.name,
        description: formData.description,
        methodology: formData.methodology,
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdBy: user.id || user._id || "",
        isArchived: false,
      } as any);

      setCreateSuccess(true);
      setTimeout(() => {
        setShowCreateModal(false);
        setFormData({
          name: "",
          description: "",
          methodology: "agile",
          startDate: getTodayDate(),
          endDate: "",
        });
        setCreateSuccess(false);
      }, 1500);
    } catch (error) {
      console.error("Create project error:", error);
      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to create project. Please try again.",
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSearchUser = async (input: string) => {
    setInviteData({ ...inviteData, searchInput: input });

    if (input.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const isEmail = input.includes("@");
      const query = isEmail ? `email=${input}` : `fullName=${input}`;
      const response = await fetch(`${API_BASE_URL}/api/users/search?${query}`);

      if (response.ok) {
        const users = await response.json();
        setUserSuggestions(users);
      }
    } catch (error) {
      console.error("Search user error:", error);
    }
  };

  const handleInviteUser = async (userOrEmail: any) => {
    if (!selectedProjectId) return;

    setInviteError("");
    setInviteSuccess(false);
    setInviteLoading(true);
    try {
      const invitePayload =
        typeof userOrEmail === "string"
          ? { email: userOrEmail, role: inviteData.role }
          : {
              fullName: userOrEmail.fullName || userOrEmail.name,
              email: userOrEmail.email,
              role: inviteData.role,
            };

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedProjectId}/invite`,
        {
          method: "POST",
          headers: authJsonHeaders,
          body: JSON.stringify(invitePayload),
        },
      );

      if (response.ok) {
        const result = await response.json();
        setInviteSuccess(true);
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteData({ searchInput: "", role: "Member" });
          setUserSuggestions([]);
          setInviteSuccess(false);
        }, 1500);
      } else {
        const error = await response.json();
        setInviteError(error.message || "Failed to invite user");
      }
    } catch (error) {
      console.error("Invite error:", error);
      setInviteError("Failed to invite user. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAddSprint = async (projectId: string, sprintName: string) => {
    try {
      const newSprint = await createWorkUnit({
        projectId,
        name: sprintName,
        type: "sprint",
        order: workUnits.length + 1,
      });

      setWorkUnits((prev: WorkUnit[]) => [...prev, newSprint]);
    } catch (error) {
      console.error("Failed to add sprint:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage all your projects in one place</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first project
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const projectId = (project.id || project._id)!;
            const members = getProjectMembers(projectId);
            const projectTasks = getTasksByProject(projectId);
            const completedTasks = projectTasks.filter(
              (t) => t.status === "done",
            ).length;
            const progress =
              projectTasks.length > 0
                ? (completedTasks / projectTasks.length) * 100
                : 0;

            return (
              <Link
                key={projectId}
                to={`/app/projects/${projectId}`}
                className={`bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow ${project.isCompleted ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {project.name}
                </h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{Math.round(progress)}% Complete</span>
                  {project.isCompleted && (
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                      Completed
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                Create New Project
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{createError}</p>
                  </div>
                </div>
              )}

              {createSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900">Success</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Project created successfully!
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Website Redesign"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your project..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Methodology
                </label>
                <select
                  value={formData.methodology}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      methodology: e.target.value as Methodology,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="agile">Agile (Scrum/Sprint-based)</option>
                  <option value="kanban">Kanban (Continuous Flow)</option>
                  <option value="waterfall">Waterfall (Phase-based)</option>
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  {formData.methodology === "agile" &&
                    "Best for iterative development with sprints"}
                  {formData.methodology === "kanban" &&
                    "Best for continuous workflow and task visualization"}
                  {formData.methodology === "waterfall" &&
                    "Best for sequential, phase-based projects"}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={todayDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      startDate: getTodayDate(),
                    }));
                    setShowCreateModal(true);
                  }}
                  disabled={isCreatingProject}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingProject ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Invite to Project
              </h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setUserSuggestions([]);
                  setInviteData({ searchInput: "", role: "Member" });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{inviteError}</p>
                  </div>
                </div>
              )}

              {inviteSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900">Success</h3>
                    <p className="text-sm text-green-700 mt-1">
                      User invited to project!
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Email or Name
                </label>
                <input
                  type="text"
                  value={inviteData.searchInput}
                  onChange={(e) => handleSearchUser(e.target.value)}
                  disabled={inviteLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="john@example.com hoặc John Doe"
                />
              </div>

              {/* User Suggestions */}
              {userSuggestions.length > 0 && (
                <div className="border rounded-lg overflow-hidden bg-gray-50 max-h-48 overflow-y-auto">
                  {userSuggestions.map((suggestion) => (
                    <button
                      key={suggestion._id || suggestion.id}
                      onClick={() => handleInviteUser(suggestion)}
                      disabled={inviteLoading}
                      className="w-full text-left px-4 py-3 hover:bg-blue-100 disabled:hover:bg-gray-50 border-b last:border-b-0 transition-colors disabled:opacity-50"
                    >
                      <div className="font-medium text-gray-900">
                        {suggestion.fullName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {suggestion.email}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* If email not found, allow direct invite */}
              {inviteData.searchInput.includes("@") &&
                userSuggestions.length === 0 &&
                inviteData.searchInput.length > 2 && (
                  <button
                    onClick={() => handleInviteUser(inviteData.searchInput)}
                    disabled={inviteLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {inviteLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      `Invite ${inviteData.searchInput} (New User)`
                    )}
                  </button>
                )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) =>
                    setInviteData({ ...inviteData, role: e.target.value })
                  }
                  disabled={inviteLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="Member">Member</option>
                  <option value="Lead">Lead</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
