import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Task } from '../../types';
import { Attachment } from '../../types';

import {
  ArrowLeft,
  Plus,
  X,
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  Clock,
} from 'lucide-react';


const ItemType = 'TASK';
const API_BASE_URL = "http://localhost:5000";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  users: any[];
  isProjectCompleted: boolean; // Add this prop
}

function TaskCard({ task, onClick, users, isProjectCompleted }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: task.id || task._id, workUnitId: task.workUnitId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const assigneeId = String(task.assigneeId || '');
  const projectId = String(task.projectId || '');
  const { getTaskComments, getTaskAttachments, getAllUsers, getAllUserProjects } = useData();
  const taskId = task.id || task._id || '';
  const comments = getTaskComments(taskId);
  const attachments = getTaskAttachments(taskId);
  const allUserProjects = getAllUserProjects ? getAllUserProjects() : [];
  const projectUserProjects = allUserProjects.filter(up => String(up.projectId || '').trim() === projectId);
  const memberIds = projectUserProjects.map(up => String(up.userId || '').trim());
  const projectMembers = getAllUsers().filter(u => {
    const userId = String(u.id || u._id || '').trim();
    return memberIds.includes(userId);
  });
  const assignee = projectMembers.find(
    (u) => String(u.id || u._id || '') === assigneeId
  );

  let statusColor = '';
  if (task.status === 'todo') statusColor = 'bg-gray-100 border-gray-300';
  else if (task.status === 'in-progress') statusColor = 'bg-yellow-100 border-yellow-300';
  else if (task.status === 'done') statusColor = 'bg-green-100 border-green-300';
  else statusColor = 'bg-white border-gray-300';

  return (
    <div
      ref={drag as any}
      onClick={onClick} // Allow opening task details regardless of project completion
      className={`p-4 rounded-lg border hover:shadow-md cursor-pointer transition-all ${statusColor} ${isDragging ? 'opacity-50' : 'opacity-100'} ${isProjectCompleted ? 'cursor-not-allowed' : ''}`}
    >
      <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-gray-600">
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
          {task.timeSpent && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{task.timeSpent}h</span>
            </div>
          )}
        </div>

        {assignee && (
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs text-blue-600 font-medium">
              {assignee.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {task.deadline && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
          <Calendar className="w-3 h-3" />
          {new Date(task.deadline).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

interface ColumnProps {
  workUnit: any;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDrop: (taskId: string, newWorkUnitId: string) => void;
  onAddTask: (workUnitId: string) => void;
  users: any[];
  isProjectCompleted: boolean; // Add this prop
}

function Column({ workUnit, tasks, onTaskClick, onDrop, onAddTask, users, isProjectCompleted }: ColumnProps) {
  const workUnitId = workUnit.id || workUnit._id || '';
  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
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
        {!isProjectCompleted && ( // Hide '+ Task' button if project is completed
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
        className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-transparent'
          }`}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id || task._id}
            task={task}
            onClick={() => onTaskClick(task)}
            users={users}
            isProjectCompleted={isProjectCompleted} // Pass the prop here
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
    getProjectWorkUnits,
    getTasksByWorkUnit,
    updateTask,
    createTask,
    getAllUsers,
    getTaskComments,
    getTaskAttachments,
    addComment,
    loadProjectData,
    getAllUserProjects,
    createSprint,
    addAttachment,
    removeAttachment,
    deleteWorkUnit,
  } = useData();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createWorkUnitId, setCreateWorkUnitId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newComment, setNewComment] = useState('');
  const [timeLog, setTimeLog] = useState('');
  const [taskChanges, setTaskChanges] = useState<Partial<Task>>({});
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenAttachment, setFullscreenAttachment] = useState<Attachment | null>(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintName, setSprintName] = useState("");

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskChanges({});
  };

  if (!projectId || !user) return null;

  // Load project data on mount
  React.useEffect(() => {
    if (projectId && projectId !== 'undefined') {
      loadProjectData(projectId);
    }
  }, [projectId]);

  const project = getProject(projectId);
  const isProjectCompleted = project?.isCompleted || false;
  const workUnits = getProjectWorkUnits(projectId) || []; // Ensure 'workUnits' is defined
  const users = getAllUsers() || []; // Ensure 'users' is defined
  const allUserProjects = getAllUserProjects ? getAllUserProjects() : [];
  const projectIdStr = String(projectId);
  const projectUserProjects = allUserProjects.filter(up => {
    const pid = String(up.projectId || '').trim();
    return pid === projectIdStr;
  });
  const memberIds = projectUserProjects.map(up => String(up.userId || '').trim());
  const projectMembers = users.filter((u: any) => { // Ensure 'projectMembers' is defined and add type for 'u'
    const userId = String(u.id || u._id || '').trim();
    return memberIds.includes(userId);
  });

  if (!project) return null; // Ensure 'project' is defined before usage

  const normalizeId = (id: any) => { // Ensure 'normalizeId' is defined
    if (!id) return '';
    if (typeof id === 'object' && id._id) return String(id._id);
    return String(id);
  };

  const handleDrop = async (taskId: string, newWorkUnitId: string) => { // Ensure 'handleDrop' is defined
    if (!taskId || !newWorkUnitId) return;

    const tasksInUnit = getTasksByWorkUnit(newWorkUnitId);
    const newOrder = tasksInUnit.length;

    try {
      await updateTask(taskId, { workUnitId: newWorkUnitId, order: newOrder });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  const handleAddTask = (workUnitId: string) => { // Ensure 'handleAddTask' is defined
    setCreateWorkUnitId(workUnitId);
    setShowCreateTask(true);
  };

  const handleOpenSprintModal = () => {
    setSprintName("");
    setShowSprintModal(true);
  };

  const handleCreateSprint = async () => {
    try {
      await createSprint(
        projectId,
        `Sprint ${sprintName}`, // tên do người dùng nhập
        undefined,
        undefined,
        "Goal cho sprint"
      );
      setShowSprintModal(false);
    } catch (error) {
      console.error("Failed to create sprint:", error);
    }
  };

  const handleAddAttachment = async (file: File) => {
    console.log("handleAddAttachment called with:", file.name);
    if (!selectedTask || !user) return;

    const taskId = selectedTask.id || selectedTask._id;
    if (!taskId) return;

    // ✅ chỉ gọi lại addAttachment, không fetch trực tiếp nữa
    await addAttachment(taskId, file);
  };

  const handleSaveTask = () => {
    if (!selectedTask) return;

    const selectedTaskId = String(selectedTask.id || selectedTask._id || '');
    if (!selectedTaskId) return;

    if (Object.keys(taskChanges).length > 0) {
      updateTask(selectedTaskId, taskChanges);
      setTaskChanges({});
    }

    setSelectedTask(null);
  };



  const handleCloseTaskModal = () => { // Ensure 'handleCloseTaskModal' is defined
    if (Object.keys(taskChanges).length > 0) {
      setShowUnsavedChanges(true);
    } else {
      setSelectedTask(null);
      setTaskChanges({});
    }
  };

  const handleCancelClose = () => { // Ensure 'handleCancelClose' is defined
    setShowUnsavedChanges(false);
  };

  const handleConfirmClose = () => { // Ensure 'handleConfirmClose' is defined
    setShowUnsavedChanges(false);
    setSelectedTask(null);
    setTaskChanges({});
  };

  const handleCreateTask = () => { // Ensure 'handleCreateTask' is defined
    if (!newTaskTitle.trim()) {
      alert('Task title is required');
      return;
    }

    if (!newTaskDesc.trim()) {
      alert('Task description is required');
      return;
    }

    const normalizedWorkUnitId = String(createWorkUnitId).trim();
    const tasksInUnit = getTasksByWorkUnit(normalizedWorkUnitId);

    // Check for unique task title within the same column
    const existingTask = tasksInUnit.find(
      (task) => task.title.trim().toLowerCase() === newTaskTitle.trim().toLowerCase()
    );
    if (existingTask) {
      alert('Task title must be unique within the same column');
      return;
    }

    createTask({
      projectId: projectId || '',
      workUnitId: normalizedWorkUnitId,
      title: newTaskTitle,
      description: newTaskDesc,
      status: 'todo',
      createdBy: user.id || user._id || '',
      order: tasksInUnit.length,
    });

    setShowCreateTask(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleTaskChange = (field: keyof Task, value: any) => { // Ensure 'handleTaskChange' is defined
    setTaskChanges(prev => ({ ...prev, [field]: value }));

    if (field === 'assigneeId' && selectedTask) {
      const assignedUser = users?.find((u: any) => String(u.id || u._id) === String(value));
      if (assignedUser) {
        // Send notification
        fetch('http://localhost:5000/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: assignedUser.id || assignedUser._id,
            type: 'task',
            title: `Assigned to Task: ${selectedTask.title}`,
            message: `You have been assigned to task "${selectedTask.title}" in project ${project?.name}`,
            relatedEntityId: selectedTask.id || selectedTask._id,
            relatedEntityType: 'task',
          }),
        });
      }
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTask) return;

    addComment(selectedTaskId, newComment);

    setNewComment('');
  };

  const handleLogTime = () => {
    if (!timeLog) return;

    const hours = parseFloat(timeLog);
    if (isNaN(hours) || hours <= 0) return;

    const currentTimeSpent = selectedTask?.timeSpent || 0;
    updateTask(selectedTaskId, { timeSpent: currentTimeSpent + hours });

    setTimeLog('');
  };


  const selectedTaskId = selectedTask?.id || selectedTask?._id || '';
  const selectedTaskAttachments = selectedTaskId
    ? getTaskAttachments(selectedTaskId)
    : [];

  const updatedAttachments = (selectedTaskAttachments || []).map((att: Attachment) => {
    return {
      ...att,
      fileName: att.fileName || 'Unknown file',
      fileSize: att.fileSize || 0,
      fileUrl: att.fileUrl || '',
      uploadedAt: att.uploadedAt || '',
      uploadedBy: att.uploadedBy || '',
    };
  });

  const selectedTaskComments = selectedTask ? getTaskComments(selectedTaskId) : [];
  const updatedComments = (selectedTaskComments || []).map((comment: any) => {
    const foundUser = comment.userId; // đã populate
    return {
      ...comment,
      author: foundUser ? foundUser.fullName : 'Unknown User',
      authorInitial: foundUser ? foundUser.fullName.charAt(0).toUpperCase() : '?',
      content: comment.content || '',
      createdAt: comment.createdAt || '',
    };
  });

  const handleOpenFullscreen = (attachment: Attachment) => {
    const fullUrl = `${API_BASE_URL}${attachment.fileUrl}`;
    console.log("Fullscreen image URL:", fullUrl);
    setFullscreenImage(fullUrl);
    setFullscreenAttachment(attachment);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
    setFullscreenAttachment(null);
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await removeAttachment(attachmentId);
      if (selectedTask) {
        const taskId = selectedTask._id ?? selectedTask.id;
        if (typeof taskId === 'string') {
          getTaskAttachments(taskId);
        }
      }
      // Đóng fullscreen sau khi xoá
      handleCloseFullscreen();
      // Hiện alert mặc định
      alert('Attachment deleted successfully');
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment');
    }
  };

  const handleDeleteWorkUnit = async (workUnitId: string) => {
    if (!projectId) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this work unit? All tasks in this work unit will also be deleted.');
    if (!confirmDelete) return;

    try {
      await deleteWorkUnit(workUnitId);
      loadProjectData(projectId); // Refresh project data
    } catch (error) {
      console.error('Failed to delete work unit:', error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
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
                <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1> {/* Ensure 'project' is defined */}
                <p className="text-sm text-gray-600 capitalize">{project?.methodology} Board</p> {/* Ensure 'project' is defined */}
              </div>
              {project?.methodology === 'agile' && !isProjectCompleted && (
                <button
                  onClick={handleOpenSprintModal} // mở modal thay vì gọi trực tiếp
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ➕ New Sprint
                </button>
              )}
              {showSprintModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded shadow-lg w-96">
                    <h2 className="text-lg font-semibold mb-4">Tạo Sprint mới</h2>
                    <input
                      type="text"
                      value={sprintName}
                      onChange={(e) => setSprintName(e.target.value)}
                      placeholder="Nhập tên sprint"
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

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
              {workUnits.map((workUnit: any) => { // Add type for 'workUnit'
                const workUnitId = workUnit.id || workUnit._id || '';
                const tasks = getTasksByWorkUnit(workUnitId);
                return (
                  <div key={workUnitId} className="bg-gray-100 p-4 rounded-lg relative">
                    <Column
                      workUnit={workUnit}
                      tasks={tasks}
                      onTaskClick={handleTaskClick}
                      onDrop={(taskId, newWorkUnitId) => {
                        if (isProjectCompleted) return; // bỏ qua nếu project complete
                        return handleDrop(taskId, newWorkUnitId);
                      }}
                      onAddTask={handleAddTask}
                      users={users}
                      isProjectCompleted={isProjectCompleted}
                    />
                    {project?.methodology === 'agile' && !isProjectCompleted && (
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

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-start justify-between sticky top-0 bg-white">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Created {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Updated {new Date(selectedTask.updatedAt).toLocaleDateString()}</span>
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
                {/* Description */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedTask.description || 'No description'}</p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      disabled={isProjectCompleted}
                      value={taskChanges.status ?? selectedTask.status}
                      onChange={(e) => handleTaskChange('status', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isProjectCompleted
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                    <select
                      disabled={isProjectCompleted}
                      value={(() => {
                        if (taskChanges.assigneeId) return normalizeId(taskChanges.assigneeId);
                        return normalizeId(selectedTask.assigneeId);
                      })()}
                      onChange={(e) =>
                        handleTaskChange('assigneeId', e.target.value !== '' ? String(e.target.value) : undefined)
                      }
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isProjectCompleted
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "focus:outline-none focus:ring-2 focus:ring-blue-500"
                        }`}
                    >
                      <option value="">Unassigned</option>
                      {projectMembers.map((u: any) => {
                        const userId = normalizeId(u.id || u._id);
                        return (
                          <option key={userId} value={userId}>
                            {u.fullName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                {/* Time Tracking */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Time Tracking</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        Total logged: <span className="font-medium">{selectedTask.timeSpent || 0} hours</span>
                      </p>
                    </div>
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
                      className={`px-4 py-2 rounded-lg ${isProjectCompleted ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      Log Time
                    </button>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Attachments ({updatedAttachments.length})
                  </h3>

                  {/* Hiển thị thumbnail ảnh hoặc file */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {updatedAttachments.map(att => {
                      const isImage = att.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);
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

                  {/* Upload attachment */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Attachment (only images)</label>
                    <input
                      disabled={isProjectCompleted}
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleAddAttachment(e.target.files[0]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Fullscreen modal */}
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
                          href={`${API_BASE_URL}/download/attachments/${fullscreenAttachment.fileUrl.split('/').pop()}`}
                          className="bg-white px-2 py-1 rounded text-sm"
                        >
                          Download
                        </a>

                        <button
                          onClick={() => {
                            if (fullscreenAttachment._id) {
                              const confirmDelete = window.confirm(
                                "Bạn có chắc chắn muốn xoá file này không?"
                              );
                              if (confirmDelete) {
                                handleDeleteAttachment(fullscreenAttachment._id);
                              }
                            }
                          }}
                          className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Delete
                        </button>

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


                {/* Comments */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Comments ({updatedComments.length})</h3>
                  <div className="space-y-3 mb-4">
                    {updatedComments.map((comment) => (
                      <div key={comment.id || comment._id} className="flex gap-3">
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
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      disabled={isProjectCompleted}
                      onClick={handleAddComment}
                      className={`px-4 py-2 rounded-lg ${isProjectCompleted ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                        }`} >
                      Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer with Done button */}
              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={handleSaveTask}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {showUnsavedChanges && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Unsaved Changes</h3>
              <p className="text-gray-600 mb-6">
                You have unsaved changes. Are you sure you want to close without saving?
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

        {/* Create Task Modal */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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


