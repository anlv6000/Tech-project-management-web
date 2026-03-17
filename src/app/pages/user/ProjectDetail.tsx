import React, { useState } from "react";
import { useParams, Link } from "react-router";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { ProjectRole } from "../../types";
import {
  ArrowLeft,
  Calendar,
  Users,
  BarChart3,
  Kanban,
  UserPlus,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "reports"
  >("overview");
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteData, setInviteData] = useState({
    searchInput: "",
    role: "Member",
  });
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");

  if (!projectId) return null;

  // Load project data on mount
  React.useEffect(() => {
    if (projectId && projectId !== "undefined") {
      loadProjectData(projectId);
    }
  }, [projectId]);

  const project = getProject(projectId);
  const members = getProjectMembers(projectId);
  const workUnits = getProjectWorkUnits(projectId);
  const tasks = getTasksByProject(projectId);
  const allUsers = getAllUsers();
  const token = sessionStorage.getItem("token");
  const authJsonHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const [updatedProject, setUpdatedProject] = useState({
    name: project?.name || "",
    description: project?.description || "",
  });

  if (!project) {
    return (
      <div className="p-6">
        <p>Project not found</p>
      </div>
    );
  }

  const availableUsers = allUsers.filter(
    (u) => !members.some((m) => m.userId === u.id) && u.isActive,
  );

  const handleSearchUser = async (input: string) => {
    setInviteData({ ...inviteData, searchInput: input });

    if (input.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const isEmail = input.includes("@");
      const query = isEmail ? `email=${input}` : `fullName=${input}`;
      const response = await fetch(
        `http://localhost:5000/api/users/search?${query}`,
      );

      if (response.ok) {
        const users = await response.json();
        setUserSuggestions(users);
      }
    } catch (error) {
      console.error("Search user error:", error);
    }
  };

  const handleInviteUser = async (userOrEmail: any) => {
    setInviteError("");
    setInviteSuccess(false);
    setInviteLoading(true);
    try {
      const invitePayload =
        typeof userOrEmail === "string"
          ? { email: userOrEmail, role: "Member" }
          : {
            fullName: userOrEmail.fullName || userOrEmail.name,
            email: userOrEmail.email,
            role: "Member",
          };

      const response = await fetch(
        `http://localhost:5000/api/projects/${projectId}/invite`,
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
          setShowAddMember(false);
          setUserSuggestions([]);
          setInviteData({ searchInput: "", role: "Member" });
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

  const handleCompleteProject = async () => {
    if (tasks.some((task) => task.status !== "done")) {
      alert(
        `Cannot complete project. ${tasks.filter((task) => task.status !== "done").length} tasks are not completed.`,
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to mark this project as complete? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsCompleting(true);
    setCompletionError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${projectId}/complete`,
        {
          method: "POST",
          headers: authJsonHeaders,
        },
      );

      if (response.ok) {
        alert("Project marked as complete!");
        window.location.reload();
      } else {
        const error = await response.json();
        setCompletionError(error.message || "Failed to complete project.");
      }
    } catch (error) {
      console.error("Complete project error:", error);
      setCompletionError("An error occurred while completing the project.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUpdateProject = async () => {
    setUpdateLoading(true);
    setUpdateError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${projectId}`,
        {
          method: "PUT",
          headers: authJsonHeaders,
          body: JSON.stringify(updatedProject),
        },
      );

      if (response.ok) {
        alert("Project updated successfully!");
        window.location.reload();
      } else {
        const error = await response.json();
        setUpdateError(error.message || "Failed to update project.");
      }
    } catch (error) {
      console.error("Update project error:", error);
      setUpdateError("An error occurred while updating the project.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Calculate stats
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "in-progress",
  ).length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  // Chart data
  const taskStatusData = [
    { name: "To Do", value: todoTasks, color: "#94a3b8" },
    { name: "In Progress", value: inProgressTasks, color: "#f59e0b" },
    { name: "Done", value: completedTasks, color: "#10b981" },
  ];

  const workUnitData = workUnits.map((wu) => ({
    name: wu.name,
    tasks: tasks.filter(
      (t) =>
        String(t.workUnitId || "").trim() ===
        String(wu.id || wu._id || "").trim() && t.type !== "subtask",
    ).length,
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/app/projects"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editMode ? (
                // Modal overlay
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Edit Project</h2>
                      <button onClick={() => setEditMode(false)}>
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={updatedProject.name}
                        onChange={(e) =>
                          setUpdatedProject({
                            ...updatedProject,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Project Name"
                      />
                      <textarea
                        value={updatedProject.description}
                        onChange={(e) =>
                          setUpdatedProject({
                            ...updatedProject,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Project Description"
                      />
                      {updateError && (
                        <p className="text-red-600">{updateError}</p>
                      )}
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={handleUpdateProject}
                          disabled={updateLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {updateLoading ? "Updating..." : "Save Changes"}
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {project.name}
                  </h1>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Project
                  </button>
                </>
              )}
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
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "members", label: "Members", icon: Users },
              { id: "reports", label: "Reports", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
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
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Project Progress
                </h2>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Overall Completion</span>
                    <span className="font-bold text-gray-900">
                      {Math.round(progress)}%
                    </span>
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
                    <p className="text-2xl font-bold text-gray-900">
                      {todoTasks}
                    </p>
                    <p className="text-sm text-gray-600">To Do</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {inProgressTasks}
                    </p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {completedTasks}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </div>

              {/* Work Units Timeline */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {project.methodology === "agile" && "Sprint Timeline"}
                  {project.methodology === "kanban" && "Workflow Columns"}
                  {project.methodology === "waterfall" && "Project Phases"}
                </h2>
                <div className="space-y-3">
                  {workUnits.map((wu) => {
                    const wuId = wu.id || wu._id || "";
                    const unitTasks = tasks.filter(
                      (t) =>
                        String(t.workUnitId || "").trim() ===
                        String(wuId).trim(),
                    );
                    const unitCompleted = unitTasks.filter(
                      (t) => t.status === "done",
                    ).length;
                    const unitProgress =
                      unitTasks.length > 0
                        ? (unitCompleted / unitTasks.length) * 100
                        : 0;

                    return (
                      <div key={wuId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {wu.name}
                            </h3>
                            {wu.goal && (
                              <p className="text-sm text-gray-600">{wu.goal}</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">
                            {unitTasks.length} tasks
                          </span>
                        </div>
                        {wu.startDate && wu.endDate && (
                          <div className="text-sm text-gray-600 mb-2">
                            {new Date(wu.startDate).toLocaleDateString()} -{" "}
                            {new Date(wu.endDate).toLocaleDateString()}
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

          {activeTab === "members" && (
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Team Members
                </h2>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="ml-2 px-3 py-1 text-sm bg-green-100 text-green-600 rounded hover:bg-green-200"
                >
                  Invite
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {members.map((member) => {
                    const memberUser = allUsers.find(
                      (u) =>
                        String(u.id || u._id).trim() ===
                        String(member.userId || member._id).trim(),
                    );
                    if (!memberUser) return null;

                    return (
                      <div
                        key={member.id || member._id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {memberUser.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {memberUser.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {memberUser.email}
                            </p>
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

          {activeTab === "reports" && (
            <div className="space-y-6">
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
                  Tasks by{" "}
                  {project.methodology === "agile"
                    ? "Sprint"
                    : project.methodology === "waterfall"
                      ? "Phase"
                      : "Column"}
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

      {/* Invite User Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Invite to Project
              </h2>
              <button
                onClick={() => {
                  setShowAddMember(false);
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
                    setInviteData({ ...inviteData, role: e.target.value as ProjectRole })
                  }
                  disabled={inviteLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="member">Member</option>
                  <option value="pm">Project Manager</option>
                  <option value="projectAdmin">Project Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleCompleteProject}
            disabled={isCompleting || project.isCompleted}
            className={`px-4 py-2 rounded-lg ${project.isCompleted ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} text-white`}
          >
            {isCompleting
              ? "Completing..."
              : project.isCompleted
                ? "Project Completed"
                : "Mark as Complete"}
          </button>

          {completionError && (
            <div className="text-red-600 mt-2">{completionError}</div>
          )}
        </div>
      </div>
    </div>
  );
}
