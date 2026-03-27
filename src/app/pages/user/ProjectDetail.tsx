import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { ProjectRole, UserProject } from "../../types";
import { API_BASE_URL } from "../../config/baseApi";
import {
  canCompleteProject,
  canManageMembers,
  canManageProject,
  canCreateWorkUnit,
  canEditPhase,
  canMarkPhaseDone,
} from "./permissions";
import {
  ArrowLeft,
  Users,
  BarChart3,
  Kanban,
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
    getAllUsers,
    loadProjectData,
    getTasksByWorkUnit,
    updateTask,
    updateWorkUnit,
  } = useData() as any;

  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "reports"
  >("overview");
  const [editingPhase, setEditingPhase] = useState<any>(null);
  const [phaseEndDate, setPhaseEndDate] = useState("");
  const phaseStartDate = editingPhase?.startDate
    ? new Date(editingPhase.startDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const [phaseModalError, setPhaseModalError] = useState("");
  const [phaseActionLoading, setPhaseActionLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteData, setInviteData] = useState<{
    searchInput: string;
    role: ProjectRole;
  }>({
    searchInput: "",
    role: "member",
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

  const [memberActionLoading, setMemberActionLoading] = useState("");
  const [memberActionError, setMemberActionError] = useState("");
  const [memberEditMode, setMemberEditMode] = useState(false);
  const [editedRoles, setEditedRoles] = useState<Record<string, ProjectRole>>(
    {},
  );

  const [updatedProject, setUpdatedProject] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });


  const normalizeId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "object") {
      const obj = value as { _id?: string; id?: string };
      return String(obj._id || obj.id || "");
    }
    return String(value);
  };

  const normalizeRole = (role: unknown): ProjectRole | null => {
    if (!role) return null;

    const value = String(role).trim();

    if (value === "projectAdmin" || value === "Project Admin") {
      return "projectAdmin";
    }

    if (
      value === "projectManager" ||
      value === "Project Manager" ||
      value === "pm" ||
      value === "PM" ||
      value === "Lead" ||
      value === "Manager"
    ) {
      return "projectManager";
    }

    if (value === "member" || value === "Member") {
      return "member";
    }

    if (value === "viewer" || value === "Viewer") {
      return "viewer";
    }

    return null;
  };

  const formatRoleLabel = (role: unknown) => {
    const normalized = normalizeRole(role);
    if (normalized === "projectAdmin") return "Project Admin";
    if (normalized === "projectManager") return "Project Manager";
    if (normalized === "member") return "Member";
    if (normalized === "viewer") return "Viewer";
    return "Unknown Role";
  };

  if (!projectId) return null;

  useEffect(() => {
    if (projectId && projectId !== "undefined") {
      loadProjectData(projectId);
    }
  }, [projectId]);

  const project = getProject(projectId);
  const rawMembers = (getProjectMembers(projectId) || []) as UserProject[];
  const workUnits = getProjectWorkUnits(projectId) || [];
  const tasks = getTasksByProject(projectId) || [];
  const allUsers = getAllUsers() || [];

  const members = useMemo(() => {
    return rawMembers.map((member) => ({
      ...member,
      role: normalizeRole(member.role),
    }));
  }, [rawMembers]);

  const currentUserId = normalizeId(user?.id || user?._id).trim();

  const currentMember = members.find((member) => {
    const memberUserId = normalizeId(member.userId).trim();
    return memberUserId === currentUserId;
  });

  const currentProjectRole = normalizeRole(currentMember?.role);

  const isPhaseCompleted = (wu: any) => {
    return wu.isDone === true;
  };

  const isPhaseEditable = (wu: any) => {
    if (wu.type !== "phase") return false;
    if (!canEditPhase(currentProjectRole)) return false;
    if (wu.order === 1) return true;

    const prevPhase = workUnits.find(
      (item: any) => item.type === "phase" && item.order === wu.order - 1,
    );

    return prevPhase ? isPhaseCompleted(prevPhase) : true;
  };

  const token = sessionStorage.getItem("token");
  const authJsonHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    if (project) {
      setUpdatedProject({
        name: project.name || "",
        description: project.description || "",
        startDate: project.startDate ? project.startDate.slice(0, 10) : "",
        endDate: project.endDate ? project.endDate.slice(0, 10) : "",
      });
    }
  }, [project]);

  if (!project) {
    return (
      <div className="p-6">
        <p>Project not found</p>
      </div>
    );
  }

  const handleSearchUser = async (input: string) => {
    setInviteData((prev) => ({ ...prev, searchInput: input }));
    setInviteError("");
    setInviteSuccess(false);

    if (input.trim().length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const isEmail = input.includes("@");
      const query = isEmail
        ? `email=${encodeURIComponent(input)}`
        : `fullName=${encodeURIComponent(input)}`;

      const response = await fetch(`${API_BASE_URL}/api/users/search?${query}`);

      if (response.ok) {
        const result = await response.json();
        const filtered = Array.isArray(result)
          ? result.filter(
            (u: any) =>
              !members.some(
                (m) => normalizeId(m.userId) === normalizeId(u._id || u.id),
              ),
          )
          : [];

        setUserSuggestions(filtered);
      } else {
        setUserSuggestions([]);
      }
    } catch (error) {
      console.error("Search user error:", error);
      setUserSuggestions([]);
    }
  };

  const handleInviteUser = async (userOrEmail: any) => {
    if (!currentProjectRole || !canManageMembers(currentProjectRole)) {
      setInviteError("You do not have permission to manage project members.");
      return;
    }

    setInviteError("");
    setInviteSuccess(false);
    setInviteLoading(true);

    try {
      const invitePayload =
        typeof userOrEmail === "string"
          ? {
            email: userOrEmail,
            role: inviteData.role,
          }
          : {
            fullName: userOrEmail.fullName || userOrEmail.name,
            email: userOrEmail.email,
            role: inviteData.role,
          };

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/invite`,
        {
          method: "POST",
          headers: authJsonHeaders,
          body: JSON.stringify(invitePayload),
        },
      );

      const result = await response.json();

      if (response.ok) {
        setInviteSuccess(true);
        await loadProjectData(projectId);
        setUserSuggestions([]);

        setTimeout(() => {
          setShowAddMember(false);
          setInviteData({ searchInput: "", role: "member" });
          setInviteSuccess(false);
        }, 1200);
      } else {
        setInviteError(result.message || "Failed to invite user");
      }
    } catch (error) {
      console.error("Invite error:", error);
      setInviteError("Failed to invite user. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleStartEditMembers = () => {
    const initialRoles: Record<string, ProjectRole> = {};
    members.forEach((member) => {
      const memberUserId = normalizeId(member.userId);
      const normalizedRole = normalizeRole(member.role);

      if (memberUserId && normalizedRole) {
        initialRoles[memberUserId] = normalizedRole;
      }
    });
    setEditedRoles(initialRoles);
    setMemberActionError("");
    setMemberEditMode(true);
  };

  const handleCancelEditMembers = () => {
    const initialRoles: Record<string, ProjectRole> = {};
    members.forEach((member) => {
      const memberUserId = normalizeId(member.userId);
      const normalizedRole = normalizeRole(member.role);

      if (memberUserId && normalizedRole) {
        initialRoles[memberUserId] = normalizedRole;
      }
    });
    setEditedRoles(initialRoles);
    setMemberActionError("");
    setMemberEditMode(false);
  };

  const handleSaveMemberRoles = async () => {
    if (!currentProjectRole || !canManageMembers(currentProjectRole)) {
      setMemberActionError(
        "You do not have permission to update member roles.",
      );
      return;
    }

    setMemberActionError("");
    setMemberActionLoading("saving");

    try {
      const changedMembers = members.filter((member) => {
        const memberUserId = normalizeId(member.userId);
        const isCurrentUser = memberUserId === currentUserId;
        if (isCurrentUser) return false;

        const originalRole = normalizeRole(member.role);
        const editedRole = normalizeRole(editedRoles[memberUserId]);

        if (!originalRole || !editedRole) return false;

        return editedRole !== originalRole;
      });

      if (changedMembers.length === 0) {
        setMemberActionError("No role changes detected.");
        setMemberEditMode(false);
        setMemberActionLoading("");
        return;
      }

      await Promise.all(
        changedMembers.map(async (member) => {
          const memberUserId = normalizeId(member.userId);
          const newRole = normalizeRole(editedRoles[memberUserId]);

          if (!newRole) {
            throw new Error(`Invalid role for user ${memberUserId}`);
          }

          const response = await fetch(
            `${API_BASE_URL}/api/user-projects/${memberUserId}/${projectId}`,
            {
              method: "PUT",
              headers: authJsonHeaders,
              body: JSON.stringify({ role: newRole }),
            },
          );

          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              result.message || `Failed to update role for ${memberUserId}`,
            );
          }
        }),
      );

      await loadProjectData(projectId);
      setMemberEditMode(false);
      setMemberActionLoading("");
    } catch (error: any) {
      console.error("Save member roles error:", error);
      setMemberActionError(
        error?.message || "An error occurred while updating member role.",
      );
      setMemberActionLoading("");
    }
  };
  const handleCompleteProject = async () => {
    if (!currentProjectRole || !canCompleteProject(currentProjectRole)) {
      setCompletionError(
        "You do not have permission to complete this project.",
      );
      return;
    }

    if (tasks.some((task: any) => task.status !== "done")) {
      alert(
        `Cannot complete project. ${tasks.filter((task: any) => task.status !== "done").length
        } tasks are not completed.`,
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
        `${API_BASE_URL}/api/projects/${projectId}/complete`,
        {
          method: "POST",
          headers: authJsonHeaders,
        },
      );

      const result = await response.json();

      if (response.ok) {
        alert("Project marked as complete!");
        await loadProjectData(projectId);
        window.location.reload();
      } else {
        setCompletionError(result.message || "Failed to complete project.");
      }
    } catch (error) {
      console.error("Complete project error:", error);
      setCompletionError("An error occurred while completing the project.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!currentProjectRole || !canManageProject(currentProjectRole)) {
      setUpdateError("You do not have permission to update this project.");
      return;
    }

    setUpdateLoading(true);
    setUpdateError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}`,
        {
          method: "PUT",
          headers: authJsonHeaders,
          body: JSON.stringify(updatedProject),
        },
      );

      const result = await response.json();

      if (response.ok) {
        alert("Project updated successfully!");
        setEditMode(false);
        await loadProjectData(projectId);
        window.location.reload();
      } else {
        setUpdateError(result.message || "Failed to update project.");
      }
    } catch (error) {
      console.error("Update project error:", error);
      setUpdateError("An error occurred while updating the project.");
    } finally {
      setUpdateLoading(false);
    }
  };
  const openPhaseEditor = (wu: any) => {
    setPhaseModalError("");
    setPhaseEndDate(
      wu.endDate ? new Date(wu.endDate).toISOString().split("T")[0] : "",
    );
    setEditingPhase(wu);
  };

  const closePhaseEditor = () => {
    setEditingPhase(null);
    setPhaseModalError("");
    setPhaseEndDate("");
  };

  const handleSavePhase = async () => {
    if (!editingPhase) return;
    if (!phaseEndDate) {
      setPhaseModalError("End date is required.");
      return;
    }

    if (!canEditPhase(currentProjectRole)) {
      setPhaseModalError("Only project admins can update phases.");
      return;
    }

    const startDateObj = editingPhase?.startDate
      ? new Date(editingPhase.startDate)
      : new Date();
    const endDateObj = new Date(phaseEndDate);

    if (endDateObj < startDateObj) {
      setPhaseModalError("End date must be on or after phase start date.");
      return;
    }

    if (project?.endDate && endDateObj > new Date(project.endDate)) {
      setPhaseModalError("End date cannot exceed project end date.");
      return;
    }

    setPhaseActionLoading(true);
    setPhaseModalError("");

    try {
      await updateWorkUnit(editingPhase.id || editingPhase._id, {
        endDate: phaseEndDate,
      });

      await loadProjectData(projectId);
      closePhaseEditor();
    } catch (error: any) {
      console.error("Phase update error:", error);
      setPhaseModalError(
        error?.message || "An error occurred while updating the phase.",
      );
    } finally {
      setPhaseActionLoading(false);
    }
  };

  const handleMarkPhaseDone = async (wu: any) => {
    if (!canMarkPhaseDone(currentProjectRole)) {
      alert("Only project admins can complete phases.");
      return;
    }

    if (wu.isDone) {
      alert("This phase is already completed.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/work-units/mark-done/${wu.id || wu._id}`,
        {
          method: "PUT",
          headers: authJsonHeaders,
        },
      );

      if (response.ok) {
        await loadProjectData(projectId);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to mark phase as done");
      }
    } catch (error) {
      console.error("Mark phase done error:", error);
      alert("Failed to mark phase as done");
    }
  };

  const isOverdue =
    new Date(project.endDate) < new Date() && !project.isCompleted;

  const completedTasks = tasks.filter((t: any) => t.status === "done").length;
  const inProgressTasks = tasks.filter(
    (t: any) => t.status === "in-progress",
  ).length;
  const todoTasks = tasks.filter((t: any) => t.status === "todo").length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const taskStatusData = [
    { name: "To Do", value: todoTasks, color: "#94a3b8" },
    { name: "In Progress", value: inProgressTasks, color: "#f59e0b" },
    { name: "Done", value: completedTasks, color: "#10b981" },
  ];

  const workUnitData = workUnits.map((wu: any) => ({
    name: wu.name,
    tasks: tasks.filter(
      (t: any) =>
        String(t.workUnitId || "").trim() ===
        String(wu.id || wu._id || "").trim() && t.type !== "subtask",
    ).length,
  }));


  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/app/projects"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {editMode ? (
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
                          setUpdatedProject((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Project Name"
                      />

                      <textarea
                        value={updatedProject.description}
                        onChange={(e) =>
                          setUpdatedProject((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Project Description"
                      />

                      {/* Start Date */}
                      <input
                        type="date"
                        value={updatedProject.startDate || ""}
                        onChange={(e) =>
                          setUpdatedProject((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        min={new Date().toISOString().split("T")[0]} // hôm nay
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Start Date"
                      />

                      {/* End Date */}
                      <input
                        type="date"
                        value={updatedProject.endDate || ""}
                        onChange={(e) =>
                          setUpdatedProject((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        min={updatedProject.startDate || new Date().toISOString().split("T")[0]} // ít nhất bằng startDate
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="End Date"
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
                  {/* Hiển thị deadline */}
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <span className="font-medium text-gray-700">Deadline:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${new Date(project.endDate) < new Date() && !project.isCompleted
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {isOverdue && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                      <AlertCircle className="w-5 h-5" />
                      <span>This project has passed its end date and is overdue.</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {currentProjectRole &&
                      canManageProject(currentProjectRole) && (
                        <button
                          onClick={() => setEditMode(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Edit Project
                        </button>
                      )}
                  </div>
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
                  onClick={() =>
                    setActiveTab(tab.id as "overview" | "members" | "reports")
                  }
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

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
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
                    />
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

              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {project.methodology === "agile" && "Sprint Timeline"}
                  {project.methodology === "kanban" && "Workflow Columns"}
                  {project.methodology === "waterfall" && "Project Phases"}
                </h2>

                <div className="space-y-3">
                  {workUnits.map((wu: any) => {
                    const now = new Date();
                    const isOverdue = wu.endDate && new Date(wu.endDate) < now && !wu.isDone;
                    const wuId = wu.id || wu._id || "";
                    const unitTasks = tasks.filter(
                      (t: any) =>
                        String(t.workUnitId || "").trim() ===
                        String(wuId).trim(),
                    );
                    const unitCompleted = unitTasks.filter(
                      (t: any) => t.status === "done",
                    ).length;
                    const unitProgress =
                      unitTasks.length > 0
                        ? (unitCompleted / unitTasks.length) * 100
                        : 0;

                    return (
                      <div key={wuId} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {wu.name}
                            </h3>
                            {wu.goal && (
                              <p className="text-sm text-gray-600">{wu.goal}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-sm text-gray-600">
                              {unitTasks.length} tasks
                            </span>
                            {wu.type === "phase" && (canEditPhase(currentProjectRole) || canMarkPhaseDone(currentProjectRole)) && (
                              <div className="flex items-center gap-2">
                                {canEditPhase(currentProjectRole) && (
                                  <button
                                    disabled={!isPhaseEditable(wu)}
                                    onClick={() => openPhaseEditor(wu)}
                                    className={`text-xs px-2 py-1 rounded ${isPhaseEditable(wu)
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                      }`}
                                  >
                                    Edit Phase Dates
                                  </button>
                                )}
                                {canMarkPhaseDone(currentProjectRole) && (
                                  <button
                                    disabled={!isPhaseEditable(wu) || wu.isDone}
                                    onClick={() => handleMarkPhaseDone(wu)}
                                    className={`text-xs px-2 py-1 rounded ${isPhaseEditable(wu) && !wu.isDone
                                      ? "bg-green-600 text-white hover:bg-green-700"
                                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                      }`}
                                  >
                                    {wu.isDone ? "Completed" : "Mark as Completed"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          {wu.startDate
                            ? new Date(wu.startDate).toLocaleDateString()
                            : "Start: not set"}
                          {" - "}
                          {wu.endDate
                            ? new Date(wu.endDate).toLocaleDateString()
                            : "End: not set"}

                          {isOverdue && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                              Overdue
                            </span>
                          )}
                        </div>


                        {wu.type === "phase" && canEditPhase(currentProjectRole) && !isPhaseEditable(wu) && (
                          <p className="text-xs text-red-500">
                            Phase {wu.order} is locked until Phase {wu.order - 1} is completed.
                          </p>
                        )}

                        {wu.type === "phase" && wu.isDone && (
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Phase {wu.order} completed
                          </p>
                        )}

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${unitProgress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {editingPhase && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-[420px]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Edit Phase Dates</h2>
                  <button onClick={closePhaseEditor}>
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Start Date</p>
                    <input
                      type="date"
                      value={phaseStartDate}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">End Date</p>
                    <input
                      type="date"
                      value={phaseEndDate}
                      onChange={(e) => setPhaseEndDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      max={project?.endDate ? new Date(project.endDate).toISOString().split("T")[0] : undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  {phaseModalError && (
                    <p className="text-sm text-red-600">{phaseModalError}</p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={closePhaseEditor}
                      disabled={phaseActionLoading}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePhase}
                      disabled={phaseActionLoading}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {phaseActionLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
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

                <div className="flex items-center gap-2">
                  {currentProjectRole &&
                    canManageMembers(currentProjectRole) && (
                      <>
                        {!memberEditMode ? (
                          <button
                            onClick={handleStartEditMembers}
                            className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          >
                            Edit
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleSaveMemberRoles}
                              disabled={memberActionLoading === "saving"}
                              className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {memberActionLoading === "saving"
                                ? "Saving..."
                                : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEditMembers}
                              disabled={memberActionLoading === "saving"}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setShowAddMember(true)}
                          className="ml-2 px-3 py-1 text-sm bg-green-100 text-green-600 rounded hover:bg-green-200"
                        >
                          Invite
                        </button>
                      </>
                    )}
                </div>
              </div>

              <div className="p-6">
                {memberActionError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-red-900">Error</h3>
                      <p className="text-sm text-red-700 mt-1">
                        {memberActionError}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {members.map((member) => {
                    const memberUserId = normalizeId(member.userId);
                    const populatedUser =
                      typeof member.userId === "object" ? (member.userId as any) : null;

                    const memberUser = allUsers.find(
                      (u: any) => normalizeId(u.id || u._id) === memberUserId,
                    );

                    const displayName =
                      memberUser?.fullName ||
                      populatedUser?.fullName ||
                      "Unknown User";

                    const displayEmail =
                      memberUser?.email || populatedUser?.email || "No email";

                    const isCurrentUser = memberUserId === currentUserId;
                    const normalizedMemberRole = normalizeRole(member.role);

                    return (
                      <div
                        key={member.id || member._id || memberUserId}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {displayName}
                              {isCurrentUser && (
                                <span className="ml-2 text-sm text-gray-500">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {displayEmail}
                            </p>
                          </div>
                        </div>

                        {!memberEditMode || isCurrentUser ? (
                          <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-600">
                            {formatRoleLabel(normalizedMemberRole)}
                          </span>
                        ) : (
                          <select
                            value={
                              editedRoles[memberUserId] ??
                              normalizedMemberRole ??
                              "member"
                            }
                            disabled={memberActionLoading === "saving"}
                            onChange={(e) => {
                              const nextRole = normalizeRole(e.target.value);
                              if (!nextRole) return;
                              setEditedRoles((prev) => ({
                                ...prev,
                                [memberUserId]: nextRole,
                              }));
                            }}
                            className="px-3 py-1 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="projectManager">
                              Project Manager
                            </option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}
                      </div>
                    );
                  })}

                  {members.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No members found
                    </div>
                  )}
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
                  setInviteData({ searchInput: "", role: "member" });
                  setInviteError("");
                  setInviteSuccess(false);
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
                    setInviteData((prev) => ({
                      ...prev,
                      role: e.target.value as ProjectRole,
                    }))
                  }
                  disabled={inviteLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="member">Member</option>
                  <option value="projectManager">Project Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentProjectRole && canCompleteProject(currentProjectRole) && (
        <div className="bg-white border-b p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleCompleteProject}
              disabled={isCompleting || project.isCompleted}
              className={`px-4 py-2 rounded-lg ${project.isCompleted
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
                } text-white`}
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
      )}
    </div>
  );
}