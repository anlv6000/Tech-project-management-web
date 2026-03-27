import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { Task, Attachment, ProjectRole } from "../../types";
import { API_BASE_URL } from "../../config/baseApi";
import {
  ArrowLeft,
  Plus,
  X,
  Calendar,
  MessageSquare,
  Paperclip,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";

import RelatedTasks from "../../components/task/RelatedTasks";

import {
  canCreateWorkUnit,
  canCreateTask,
  canEditTask,
  canUpdateStatus,
  canAssignTask,
  canLogWork,
  canCreateSubTask,
  canUploadAttachment,
  canDeleteAttachment,
  canComment,
  canSaveTask,
} from "./permissions";

const ItemType = "TASK";

const getAuthJsonHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const normalizeId = (id: any) => {
  if (!id) return "";
  if (typeof id === "object" && id._id) return String(id._id);
  if (typeof id === "object" && id.id) return String(id.id);
  return String(id);
};

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  users: any[];
  isProjectCompleted: boolean;
  currentProjectRole?: ProjectRole;
  currentUserId: string;
}

function TaskCard({
  task,
  onClick,
  users,
  isProjectCompleted,
  currentProjectRole,
  currentUserId,
}: TaskCardProps) {
  const { deleteTask } = useData();
  const canEditThisTask =
    !!currentProjectRole &&
    canEditTask(task, currentProjectRole, currentUserId);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: task.id || task._id, workUnitId: task.workUnitId },
    canDrag:
      !isProjectCompleted &&
      !!currentProjectRole &&
      ["projectAdmin", "pm"].includes(currentProjectRole),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTaskData, setEditTaskData] = useState({
    title: task.title,
    description: task.description,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const handleSaveEdit = async () => {
    if (!canEditThisTask) {
      setEditError("You do not have permission to edit this task.");
      return;
    }

    setEditLoading(true);
    setEditError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tasks/${task.id || task._id}`,
        {
          method: "PUT",
          headers: getAuthJsonHeaders(),
          body: JSON.stringify(editTaskData),
        },
      );

      if (response.ok) {
        alert("Task updated successfully!");
        setShowEditModal(false);
        window.location.reload();
      } else {
        const error = await response.json();
        setEditError(error.message || "Failed to update task.");
      }
    } catch (error) {
      console.error("Edit task error:", error);
      setEditError("An error occurred while updating the task.");
    } finally {
      setEditLoading(false);
    }
  };

  const { getTaskComments, getTaskAttachments } = useData();
  const taskId = task.id || task._id || "";
  const comments = getTaskComments(taskId);
  const attachments = getTaskAttachments(taskId);

  let statusColor = "";
  if (task.status === "todo") statusColor = "bg-gray-100 border-gray-300";
  else if (task.status === "in-progress")
    statusColor = "bg-yellow-100 border-yellow-300";
  else if (task.status === "done")
    statusColor = "bg-green-100 border-green-300";
  else statusColor = "bg-white border-gray-300";

  return (
    <>
      <div
        ref={drag as any}
        onClick={onClick}
        className={`p-4 rounded-lg border hover:shadow-md transition-all ${statusColor} ${
          isDragging ? "opacity-50" : "opacity-100"
        } ${isProjectCompleted ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
          {canEditThisTask && !isProjectCompleted && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const id = task.id ?? task._id;
                  if (!id) return;

                  if (
                    window.confirm(
                      `Are you sure you want to delete task "${task.title}"?`,
                    )
                  ) {
                    deleteTask(id);
                  }
                }}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-gray-600 text-sm">
          {comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{comments.length}</span>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              <span>{attachments.length}</span>
            </div>
          )}

          {task.timeSpent ? (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{task.timeSpent}h</span>
            </div>
          ) : null}
        </div>

        {task.deadline && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <Calendar className="w-3 h-3" />
            {new Date(task.deadline).toLocaleDateString()}
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] bg-opacity-90">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Task</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <input
              type="text"
              value={editTaskData.title}
              onChange={(e) =>
                setEditTaskData({ ...editTaskData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
              placeholder="Task Title"
            />

            <textarea
              value={editTaskData.description}
              onChange={(e) =>
                setEditTaskData({
                  ...editTaskData,
                  description: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
              placeholder="Task Description"
            />

            {editError && <p className="text-red-600 mb-2">{editError}</p>}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ColumnProps {
  workUnit: any;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDrop: (taskId: string, newWorkUnitId: string) => void;
  onAddTask: (workUnitId: string) => void;
  users: any[];
  isProjectCompleted: boolean;
  currentProjectRole?: ProjectRole;
  currentUserId: string;
}

function Column({
  workUnit,
  tasks,
  onTaskClick,
  onDrop,
  onAddTask,
  users,
  isProjectCompleted,
  currentProjectRole,
  currentUserId,
}: ColumnProps) {
  const workUnitId = workUnit.id || workUnit._id || "";

  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    canDrop: () =>
      !isProjectCompleted &&
      !!currentProjectRole &&
      ["projectAdmin", "pm"].includes(currentProjectRole),
    drop: (item: { id: string; workUnitId: string }) => {
      if (item.workUnitId !== workUnitId) {
        onDrop(item.id, workUnitId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{workUnit.name}</h2>
          <p className="text-sm text-gray-600">{tasks.length} tasks</p>
        </div>

        {!isProjectCompleted &&
          currentProjectRole &&
          canCreateTask(currentProjectRole) && (
            <button
              onClick={() => onAddTask(workUnitId)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          )}
      </div>

      <div
        ref={drop as any}
        className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver
            ? "bg-blue-50 border-2 border-dashed border-blue-300"
            : "bg-transparent"
        }`}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id || task._id}
            task={task}
            onClick={() => onTaskClick(task)}
            users={users}
            isProjectCompleted={isProjectCompleted}
            currentProjectRole={currentProjectRole}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

export default function TaskBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  const {
    getProject,
    getProjectMembers,
    getProjectWorkUnits,
    getTasksByWorkUnit,
    updateTask,
    createTask,
    getTask,
    getAllUsers,
    getTaskComments,
    getTaskAttachments,
    addComment,
    loadProjectData,
    createSprint,
    addAttachment,
    removeAttachment,
    deleteWorkUnit,
    getTasksByProject,
  } = useData();

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createWorkUnitId, setCreateWorkUnitId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newComment, setNewComment] = useState("");
  const [timeLog, setTimeLog] = useState("");
  const [taskChanges, setTaskChanges] = useState<Partial<Task>>({});
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenAttachment, setFullscreenAttachment] =
    useState<Attachment | null>(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [showAddSubTask, setShowAddSubTask] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [newSubTaskDesc, setNewSubTaskDesc] = useState("");
  const [taskStack, setTaskStack] = useState<Task[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const selectedTask =
    taskStack.length > 0 ? taskStack[taskStack.length - 1] : null;

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId) {
      const task = getTask(taskId);
      if (task) {
        setTaskStack([task]);
        setTaskChanges({});
        loadSubTasks(task);
      }
    }
  }, [searchParams, getTask]);

  if (!projectId || !user) return null;

  useEffect(() => {
    if (projectId && projectId !== "undefined") {
      loadProjectData(projectId);
    }
  }, [projectId]);

  const project = getProject(projectId);
  const isProjectCompleted = project?.isCompleted || false;
  const workUnits = getProjectWorkUnits(projectId) || [];
  const users = getAllUsers() || [];
  const members = getProjectMembers(projectId) || [];

  const currentUserId = normalizeId(user?.id || user?._id).trim();

  const currentMember = members.find((member: any) => {
    const memberUserId = normalizeId(
      member.userId?._id || member.userId,
    ).trim();
    return memberUserId === currentUserId;
  });

  const currentProjectRole = currentMember?.role as ProjectRole | undefined;

  const projectMembers = members
    .map((member: any) => member.userId)
    .filter(Boolean);

  if (!project) return null;

  const selectedTaskId = selectedTask?.id || selectedTask?._id || "";

  const loadSubTasks = async (task: Task) => {
    const taskId = task.id || task._id || "";
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tasks/${taskId}/subtasks`,
      );
      const data = await response.json();
      setSubTasks(data);
    } catch (error) {
      setSubTasks([]);
    }
  };

  const handleTaskClick = async (task: Task) => {
    setTaskStack([task]);
    setTaskChanges({});
    await loadSubTasks(task);
  };

  const handleSubTaskClick = async (subTask: Task) => {
    setTaskStack((prev) => [...prev, subTask]);
    setTaskChanges({});
    await loadSubTasks(subTask);
  };

  const handleBreadcrumbClick = async (index: number) => {
    const targetTask = taskStack[index];
    setTaskStack((prev) => prev.slice(0, index + 1));
    setTaskChanges({});
    await loadSubTasks(targetTask);
  };

  const handleCreateSubTask = async () => {
    if (!selectedTask) return;

    if (!currentProjectRole || !canCreateSubTask(currentProjectRole)) {
      alert("You do not have permission to create sub-tasks.");
      return;
    }

    if (!newSubTaskTitle.trim() || !newSubTaskDesc.trim()) {
      alert("Title and description are required");
      return;
    }

    const parentId = selectedTask.id || selectedTask._id;

    try {

      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: getAuthJsonHeaders(),
        body: JSON.stringify({
          projectId: selectedTask.projectId,
          workUnitId: selectedTask.workUnitId,
          title: newSubTaskTitle,
          description: newSubTaskDesc,
          status: "todo",
          createdBy: user?.id || user?._id,
          order: subTasks.length,
          parentId,
          type: "subtask",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create sub-task");
      }

      const newSub = await res.json();
      setSubTasks((prev) => [...prev, newSub]);
      setNewSubTaskTitle("");
      setNewSubTaskDesc("");
      setShowAddSubTask(false);
    } catch (err) {
      alert("Failed to create sub-task");
    }
  };

  const handleToggleSubTask = async (subTask: Task) => {
    if (isProjectCompleted) return;

    if (
      !currentProjectRole ||
      !canSaveTask(subTask, currentProjectRole, currentUserId)
    ) {
      alert("You do not have permission to update this sub-task.");
      return;
    }

    const subId = subTask.id || subTask._id;
    const newStatus = subTask.status === "done" ? "todo" : "done";

    try {
      await fetch(`${API_BASE_URL}/api/tasks/${subId}`, {
        method: "PUT",
        headers: getAuthJsonHeaders(),
        body: JSON.stringify({ ...subTask, status: newStatus }),
      });

      setSubTasks((prev) =>
        prev.map((st) =>
          st.id === subId || st._id === subId
            ? { ...st, status: newStatus }
            : st,
        ),
      );
    } catch (err) {
      console.error("Failed to update sub-task status");
    }
  };

  const handleDrop = async (taskId: string, newWorkUnitId: string) => {
    if (!taskId || !newWorkUnitId) return;

    if (!currentProjectRole || !canAssignTask(currentProjectRole)) {
      alert("You do not have permission to move tasks.");
      return;
    }

    const tasksInUnit = getTasksByWorkUnit(newWorkUnitId).filter(
      (t: any) => !t.parentId,
    );
    const newOrder = tasksInUnit.length;

    try {
      await updateTask(taskId, { workUnitId: newWorkUnitId, order: newOrder });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  const handleAddTask = (workUnitId: string) => {
    if (!currentProjectRole || !canCreateTask(currentProjectRole)) {
      alert("You do not have permission to create tasks.");
      return;
    }

    setCreateWorkUnitId(workUnitId);
    setShowCreateTask(true);
  };

  const handleOpenSprintModal = () => {
    if (!currentProjectRole || !canCreateWorkUnit(currentProjectRole)) {
      alert("You do not have permission to create sprint.");
      return;
    }

    setSprintName("");
    setShowSprintModal(true);
  };

  const handleCreateSprint = async () => {
    try {
      await createSprint(
        projectId,
        `Sprint ${sprintName}`,
        undefined,
        undefined,
        "Goal cho sprint",
      );
      setShowSprintModal(false);
    } catch (error) {
      console.error("Failed to create sprint:", error);
    }
  };

  const handleAddAttachment = async (file: File) => {
    if (!selectedTask || !user) return;

    if (!currentProjectRole || !canUploadAttachment(currentProjectRole)) {
      alert("You do not have permission to upload attachments.");
      return;
    }

    const taskId = selectedTask.id || selectedTask._id;
    if (!taskId) return;

    await addAttachment(taskId, file);
  };

  const handleSaveTask = () => {
    if (!selectedTask) return;

    if (
      !currentProjectRole ||
      !canSaveTask(selectedTask, currentProjectRole, currentUserId)
    ) {
      alert("You do not have permission to update this task.");
      return;
    }

    const selectedTaskId = String(selectedTask.id || selectedTask._id || "");
    if (!selectedTaskId) return;

    if (Object.keys(taskChanges).length > 0) {
      updateTask(selectedTaskId, taskChanges);
      setTaskChanges({});
    }

    setTaskStack([]);
    setSubTasks([]);
  };

  const handleCloseTaskModal = () => {
    if (Object.keys(taskChanges).length > 0) {
      setShowUnsavedChanges(true);
    } else {
      setTaskStack([]);
      setTaskChanges({});
      setSubTasks([]);
    }
  };

  const handleCancelClose = () => {
    setShowUnsavedChanges(false);
  };

  const handleConfirmClose = () => {
    setShowUnsavedChanges(false);
    setTaskChanges({});
    setTaskStack([]);
    setSubTasks([]);
  };

  const handleCreateTask = () => {
    if (!currentProjectRole || !canCreateTask(currentProjectRole)) {
      alert("You do not have permission to create tasks.");
      return;
    }

    if (!newTaskTitle.trim()) {
      alert("Task title is required");
      return;
    }

    if (!newTaskDesc.trim()) {
      alert("Task description is required");
      return;
    }

    const normalizedWorkUnitId = String(createWorkUnitId).trim();
    const tasksInUnit = getTasksByWorkUnit(normalizedWorkUnitId);

    const existingTask = tasksInUnit.find(
      (task: any) =>
        task.title.trim().toLowerCase() === newTaskTitle.trim().toLowerCase(),
    );

    if (existingTask) {
      alert("Task title must be unique within the same column");
      return;
    }


    createTask({
      projectId: projectId || "",
      workUnitId: normalizedWorkUnitId,
      title: newTaskTitle,
      description: newTaskDesc,
      status: "todo",
      createdBy: user.id || user._id || "",
      order: tasksInUnit.length,
      type: "parent",
    });

    setShowCreateTask(false);
    setNewTaskTitle("");
    setNewTaskDesc("");
  };

  const handleTaskChange = (field: keyof Task, value: any) => {
    if (!selectedTask || !currentProjectRole) return;

    if (
      field === "status" &&
      !canUpdateStatus(selectedTask, currentProjectRole, currentUserId)
    ) {
      alert("You do not have permission to update task status.");
      return;
    }

    if (field === "assigneeId" && !canAssignTask(currentProjectRole)) {
      alert("You do not have permission to assign task.");
      return;
    }

    if (
      field !== "status" &&
      field !== "assigneeId" &&
      !canSaveTask(selectedTask, currentProjectRole, currentUserId)
    ) {
      alert("You do not have permission to update this task.");
      return;
    }

    setTaskChanges((prev) => ({ ...prev, [field]: value }));

    if (field === "assigneeId" && selectedTask) {
      const assignedUser = users?.find(
        (u: any) => String(normalizeId(u.id || u._id)) === String(value),
      );

      if (assignedUser) {
        fetch(`${API_BASE_URL}/api/notifications`, {
          method: "POST",
          headers: getAuthJsonHeaders(),
          body: JSON.stringify({
            userId: assignedUser.id || assignedUser._id,
            type: "task",
            title: `Assigned to Task: ${selectedTask.title}`,
            message: `You have been assigned to task "${selectedTask.title}" in project ${project?.name}`,
            relatedEntityId: selectedTask.id || selectedTask._id,
            relatedEntityType: "task",
            actionLink: `/app/projects/${selectedTask.projectId}/board?taskId=${selectedTask.id || selectedTask._id}`,
            data: {
              projectId: selectedTask.projectId,
              taskId: selectedTask.id || selectedTask._id,
            },
          }),
        });
      }
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTask) return;

    if (!currentProjectRole || !canComment(currentProjectRole)) {
      alert("You do not have permission to comment.");
      return;
    }

    addComment(selectedTaskId, newComment);
    setNewComment("");
  };

  const handleAddReply = (parentId: string) => {
    if (!replyContent.trim() || !selectedTask) return;
    if (!currentProjectRole || !canComment(currentProjectRole)) {
      alert("You do not have permission to comment.");
      return;
    }
    addComment(selectedTaskId, replyContent, parentId);
    setReplyContent("");
    setReplyingTo(null);
  };

  const handleLogTime = () => {
    if (!timeLog || !selectedTask) return;

    if (
      !currentProjectRole ||
      !canLogWork(selectedTask, currentProjectRole, currentUserId)
    ) {
      alert("You do not have permission to log work on this task.");
      return;
    }

    const hours = parseFloat(timeLog);
    if (isNaN(hours) || hours <= 0) return;

    const currentTimeSpent = selectedTask?.timeSpent || 0;
    updateTask(selectedTaskId, { timeSpent: currentTimeSpent + hours });
    setTimeLog("");
  };

  const selectedTaskAttachments = selectedTaskId
    ? getTaskAttachments(selectedTaskId)
    : [];

  const updatedAttachments = (selectedTaskAttachments || []).map(
    (att: Attachment) => {
      return {
        ...att,
        fileName: att.fileName || "Unknown file",
        fileSize: att.fileSize || 0,
        fileUrl: att.fileUrl || "",
        uploadedAt: att.uploadedAt || "",
        uploadedBy: att.uploadedBy || "",
      };
    },
  );

  const selectedTaskComments = selectedTask
    ? getTaskComments(selectedTaskId)
    : [];

  const updatedComments = (selectedTaskComments || []).map((comment: any) => {
    const foundUser = comment.userId;
    return {
      ...comment,
      author: foundUser ? foundUser.fullName : "Unknown User",
      authorInitial: foundUser
        ? foundUser.fullName.charAt(0).toUpperCase()
        : "?",
      content: comment.content || "",
      createdAt: comment.createdAt || "",
    };
  });

  const handleOpenFullscreen = (attachment: Attachment) => {
    const fullUrl = `${API_BASE_URL}${attachment.fileUrl}`;
    setFullscreenImage(fullUrl);
    setFullscreenAttachment(attachment);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
    setFullscreenAttachment(null);
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const attachment = updatedAttachments.find(
      (att: any) => String(att._id || att.id) === String(attachmentId),
    );

    if (
      !currentProjectRole ||
      !canDeleteAttachment(
        currentProjectRole,
        attachment?.uploadedBy,
        currentUserId,
      )
    ) {
      alert("You do not have permission to delete this attachment.");
      return;
    }

    try {
      await removeAttachment(attachmentId);

      if (selectedTask) {
        const taskId = selectedTask._id ?? selectedTask.id;
        if (typeof taskId === "string") {
          getTaskAttachments(taskId);
        }
      }

      handleCloseFullscreen();
      alert("Attachment deleted successfully");
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      alert("Failed to delete attachment");
    }
  };

  const handleDeleteWorkUnit = async (workUnitId: string) => {
    if (!projectId) return;

    if (!currentProjectRole || !canCreateWorkUnit(currentProjectRole)) {
      alert("You do not have permission to delete work units.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this work unit? All tasks in this work unit will also be deleted.",
    );
    if (!confirmDelete) return;

    try {
      await deleteWorkUnit(workUnitId);
      loadProjectData(projectId);
    } catch (error) {
      console.error("Failed to delete work unit:", error);
    }
  };

  const renderComments = (
    comments: typeof updatedComments,
    parentId: string | null = null,
    depth = 0,
  ) => {
    const filtered = comments.filter((c: any) => {
      const cParent = c.parentId ? String(c.parentId) : null;
      const target = parentId ? String(parentId) : null;
      return cParent === target;
    });

    if (filtered.length === 0) return null;

    return filtered.map((comment: any) => (
      <div
        key={comment.id || comment._id}
        className={`flex gap-3 ${depth > 0 ? "ml-8 mt-2 border-l-2 border-gray-100 pl-3" : ""}`}
      >
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm text-blue-600 font-medium">
            {comment.authorInitial}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{comment.author}</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>

          <p className="text-gray-700">{comment.content}</p>

          {currentProjectRole &&
            canComment(currentProjectRole) &&
            !isProjectCompleted && (
              <button
                onClick={() => {
                  const id = comment.id || comment._id;
                  setReplyingTo(replyingTo === id ? null : id);
                  setReplyContent("");
                }}
                className="text-xs text-blue-500 hover:text-blue-700 mt-1"
              >
                {replyingTo === (comment.id || comment._id)
                  ? "Cancel"
                  : "Reply"}
              </button>
            )}

          {replyingTo === (comment.id || comment._id) && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    handleAddReply(comment.id || comment._id);
                }}
                autoFocus
              />
              <button
                onClick={() => handleAddReply(comment.id || comment._id)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          )}

          {/* Render replies đệ quy */}
          <div className="mt-2 space-y-3">
            {renderComments(comments, comment.id || comment._id, depth + 1)}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b p-4">
          <div className="max-w-[1600px] mx-auto">
            <Link
              to={`/app/projects/${projectId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {project?.name}
                </h1>
                <p className="text-sm text-gray-600 capitalize">
                  {project?.methodology} Board
                </p>
              </div>

              {project?.methodology === "agile" &&
                !isProjectCompleted &&
                currentProjectRole &&
                canCreateWorkUnit(currentProjectRole) && (
                  <button
                    onClick={handleOpenSprintModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + New Sprint
                  </button>
                )}

              {showSprintModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] bg-opacity-90">
                    <h2 className="text-lg font-semibold mb-4">
                      Tạo Sprint mới
                    </h2>
                    <input
                      type="text"
                      value={sprintName}
                      onChange={(e) => setSprintName(e.target.value)}
                      placeholder="Nhập tên sprint (VD: 1, 2, 3...)"
                      className="w-full px-3 py-2 border rounded mb-4"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowSprintModal(false)}
                        className="px-4 py-2 bg-gray-300 rounded"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleCreateSprint}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                      >
                        Tạo Sprint
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
              {workUnits.map((workUnit: any) => {
                const workUnitId = workUnit.id || workUnit._id || "";
                const tasks = getTasksByWorkUnit(workUnitId);

                return (
                  <div
                    key={workUnitId}
                    className="bg-gray-100 p-4 rounded-lg relative"
                  >
                    <Column
                      workUnit={workUnit}
                      tasks={tasks}
                      onTaskClick={handleTaskClick}
                      onDrop={(taskId, newWorkUnitId) => {
                        if (isProjectCompleted) return;
                        return handleDrop(taskId, newWorkUnitId);
                      }}
                      onAddTask={handleAddTask}
                      users={users}
                      isProjectCompleted={isProjectCompleted}
                      currentProjectRole={currentProjectRole}
                      currentUserId={currentUserId}
                    />

                    {project?.methodology === "agile" &&
                      !isProjectCompleted &&
                      currentProjectRole &&
                      canCreateWorkUnit(currentProjectRole) && (
                        <button
                          onClick={() => handleDeleteWorkUnit(workUnitId)}
                          className="absolute bottom-2 right-2 text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-start justify-between sticky top-0 bg-white z-10">
                <div className="flex-1">
                  {taskStack.length > 1 && (
                    <div className="flex items-center gap-1 text-sm mb-3 flex-wrap">
                      {taskStack.map((t, index) => (
                        <React.Fragment key={t.id || t._id}>
                          {index < taskStack.length - 1 ? (
                            <>
                              <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className="text-blue-600 hover:text-blue-800 hover:underline max-w-[150px] truncate"
                              >
                                {t.title}
                              </button>
                              <span className="text-gray-400">/</span>
                            </>
                          ) : (
                            <span className="text-gray-500 font-medium max-w-[200px] truncate">
                              {t.title}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {taskStack.length > 1 && (
                    <button
                      onClick={() =>
                        handleBreadcrumbClick(taskStack.length - 2)
                      }
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to parent task
                    </button>
                  )}

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedTask.title}
                  </h2>

                  {taskStack.length > 1 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 mb-2">
                      Sub-task
                    </span>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Created{" "}
                      {new Date(selectedTask.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      Updated{" "}
                      {new Date(selectedTask.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCloseTaskModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700">
                    {selectedTask.description || "No description"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      disabled={
                        isProjectCompleted ||
                        !currentProjectRole ||
                        !canUpdateStatus(
                          selectedTask,
                          currentProjectRole,
                          currentUserId,
                        )
                      }
                      value={taskChanges.status ?? selectedTask.status}
                      onChange={(e) =>
                        handleTaskChange("status", e.target.value)
                      }
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        isProjectCompleted ||
                        !currentProjectRole ||
                        !canUpdateStatus(
                          selectedTask,
                          currentProjectRole,
                          currentUserId,
                        )
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "focus:outline-none focus:ring-2 focus:ring-blue-500"
                      }`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignee
                    </label>
                    <select
                      disabled={
                        isProjectCompleted ||
                        !currentProjectRole ||
                        !canAssignTask(currentProjectRole)
                      }
                      value={(() => {
                        if (taskChanges.assigneeId)
                          return normalizeId(taskChanges.assigneeId);
                        return normalizeId(selectedTask.assigneeId);
                      })()}
                      onChange={(e) =>
                        handleTaskChange(
                          "assigneeId",
                          e.target.value !== ""
                            ? String(e.target.value)
                            : undefined,
                        )
                      }
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        isProjectCompleted ||
                        !currentProjectRole ||
                        !canAssignTask(currentProjectRole)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "focus:outline-none focus:ring-2 focus:ring-blue-500"
                      }`}
                    >
                      <option value="">Unassigned</option>
                      {projectMembers.map((u: any) => {
                        const userId = normalizeId(u._id || u.id);
                        return (
                          <option key={userId} value={userId}>
                            {u.fullName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Time Tracking
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        Total logged:{" "}
                        <span className="font-medium">
                          {selectedTask.timeSpent || 0} hours
                        </span>
                      </p>
                    </div>

                    {currentProjectRole &&
                      canLogWork(
                        selectedTask,
                        currentProjectRole,
                        currentUserId,
                      ) && (
                        <>
                          <input
                            type="number"
                            value={timeLog}
                            onChange={(e) => setTimeLog(e.target.value)}
                            placeholder="Hours"
                            step="0.5"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            disabled={isProjectCompleted}
                            onClick={handleLogTime}
                            className={`px-4 py-2 rounded-lg ${
                              isProjectCompleted
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            Log Time
                          </button>
                        </>
                      )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      Sub-tasks ({subTasks.length})
                    </h3>

                    {!isProjectCompleted &&
                      currentProjectRole &&
                      canCreateSubTask(currentProjectRole) && (
                        <button
                          onClick={() => setShowAddSubTask(!showAddSubTask)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="w-4 h-4" />
                          Add sub-task
                        </button>
                      )}
                  </div>

                  {subTasks.length > 0 &&
                    (() => {
                      const doneCount = subTasks.filter(
                        (s) => s.status === "done",
                      ).length;
                      const percent = Math.round(
                        (doneCount / subTasks.length) * 100,
                      );

                      return (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>
                              {doneCount}/{subTasks.length} completed
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                  <div className="space-y-2">
                    {subTasks.map((subTask) => {
                      const subId = subTask.id || subTask._id || "";
                      const canToggleThisSubtask =
                        !!currentProjectRole &&
                        canSaveTask(subTask, currentProjectRole, currentUserId);

                      return (
                        <div
                          key={subId}
                          className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={subTask.status === "done"}
                            onChange={() => handleToggleSubTask(subTask)}
                            disabled={
                              isProjectCompleted || !canToggleThisSubtask
                            }
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />

                          <span
                            onClick={() => handleSubTaskClick(subTask)}
                            className={`flex-1 text-sm cursor-pointer hover:text-blue-600 hover:underline ${
                              subTask.status === "done"
                                ? "line-through text-gray-400"
                                : "text-gray-700"
                            }`}
                          >
                            {subTask.title}
                          </span>

                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              subTask.status === "done"
                                ? "bg-green-100 text-green-700"
                                : subTask.status === "in-progress"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {subTask.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {showAddSubTask && (
                    <div className="mt-3 p-3 border border-dashed border-blue-300 rounded-lg bg-blue-50 space-y-2">
                      <input
                        type="text"
                        value={newSubTaskTitle}
                        onChange={(e) => setNewSubTaskTitle(e.target.value)}
                        placeholder="Sub-task title..."
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <input
                        type="text"
                        value={newSubTaskDesc}
                        onChange={(e) => setNewSubTaskDesc(e.target.value)}
                        placeholder="Description..."
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setShowAddSubTask(false)}
                          className="px-3 py-1 text-sm text-gray-600 border rounded hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateSubTask}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <RelatedTasks
                  selectedTask={selectedTask}
                  projectId={projectId}
                  isProjectCompleted={isProjectCompleted}
                  currentProjectRole={currentProjectRole}
                  currentUserId={currentUserId}
                  getTasksByProject={getTasksByProject}
                  onRelatedTaskClick={handleSubTaskClick}
                />

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Attachments ({updatedAttachments.length})
                  </h3>

                  <div className="flex flex-wrap gap-3 mb-4">
                    {updatedAttachments.map((att) => {
                      const isImage = att.fileUrl.match(
                        /\.(jpg|jpeg|png|gif)$/i,
                      );
                      return (
                        <div key={att._id} className="relative">
                          {isImage ? (
                            <img
                              src={`${API_BASE_URL}${att.fileUrl}`}
                              alt={att.fileName}
                              className="w-24 h-24 object-cover rounded cursor-pointer"
                              onClick={() => handleOpenFullscreen(att)}
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-2 border rounded">
                              <Paperclip className="w-4 h-4 text-gray-600" />
                              <span className="text-sm">{att.fileName}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {currentProjectRole &&
                    canUploadAttachment(currentProjectRole) && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Add Attachment (only images and PDFs{" "}
                          <span className="text-xs text-gray-500">
                            (max 10MB)
                          </span>
                          )
                        </label>
                        <input
                          disabled={isProjectCompleted}
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleAddAttachment(e.target.files[0]);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                </div>

                {fullscreenImage && fullscreenAttachment && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative">
                      <img
                        src={fullscreenImage}
                        alt={fullscreenAttachment.fileName}
                        className="max-h-screen max-w-screen"
                      />

                      <div className="absolute top-2 right-2 flex gap-2">
                        <a
                          href={`${API_BASE_URL}/download/attachments/${fullscreenAttachment.fileUrl
                            .split("/")
                            .pop()}`}
                          className="bg-white px-2 py-1 rounded text-sm"
                        >
                          Download
                        </a>

                        {currentProjectRole &&
                          canDeleteAttachment(
                            currentProjectRole,
                            fullscreenAttachment.uploadedBy,
                            currentUserId,
                          ) && (
                            <button
                              onClick={() => {
                                if (fullscreenAttachment._id) {
                                  const confirmDelete = window.confirm(
                                    "Bạn có chắc chắn muốn xoá file này không?",
                                  );
                                  if (confirmDelete) {
                                    handleDeleteAttachment(
                                      fullscreenAttachment._id,
                                    );
                                  }
                                }
                              }}
                              className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                            >
                              Delete
                            </button>
                          )}

                        <button
                          onClick={handleCloseFullscreen}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Comments ({updatedComments.length})
                  </h3>

                  <div className="space-y-3 mb-4">
                    {renderComments(updatedComments)}
                  </div>

                  {currentProjectRole && canComment(currentProjectRole) && (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAddComment()
                        }
                      />

                      <button
                        disabled={isProjectCompleted}
                        onClick={handleAddComment}
                        className={`px-4 py-2 rounded-lg ${
                          isProjectCompleted
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        Comment
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={handleSaveTask}
                  disabled={
                    !currentProjectRole ||
                    !canSaveTask(
                      selectedTask,
                      currentProjectRole,
                      currentUserId,
                    )
                  }
                  className={`px-6 py-2 rounded-lg font-medium ${
                    !currentProjectRole ||
                    !canSaveTask(
                      selectedTask,
                      currentProjectRole,
                      currentUserId,
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnsavedChanges && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Unsaved Changes
              </h3>
              <p className="text-gray-600 mb-6">
                You have unsaved changes. Are you sure you want to close without
                saving?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Close Without Saving
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Task</h2>
                <button
                  onClick={() => setShowCreateTask(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Task title..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Task description..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateTask(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
