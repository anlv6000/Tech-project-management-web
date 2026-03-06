import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Task } from '../../types';
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

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  users: any[];
}

function TaskCard({ task, onClick, users }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: task.id || task._id, workUnitId: task.workUnitId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const assigneeId = String(task.assigneeId || '');
  // Lấy projectId từ task
  const projectId = String(task.projectId || '');
  const { getTaskComments, getTaskAttachments, getAllUsers, getAllUserProjects } = useData();
  const taskId = task.id || task._id || '';
  const comments = getTaskComments(taskId);
  const attachments = getTaskAttachments(taskId);
  // Lấy đúng user cho assignee theo project
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

  // Color coding for status
  let statusColor = '';
  if (task.status === 'todo') statusColor = 'bg-gray-100 border-gray-300';
  else if (task.status === 'in-progress') statusColor = 'bg-yellow-100 border-yellow-300';
  else if (task.status === 'done') statusColor = 'bg-green-100 border-green-300';
  else statusColor = 'bg-white border-gray-300';

  return (
    <div
      ref={drag as any}
      onClick={onClick}
      className={`p-4 rounded-lg border hover:shadow-md cursor-pointer transition-all ${statusColor} ${isDragging ? 'opacity-50' : 'opacity-100'
        }`}
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
}

function Column({ workUnit, tasks, onTaskClick, onDrop, onAddTask, users }: ColumnProps) {
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
        <button
          onClick={() => onAddTask(workUnitId)}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
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
  }, [projectId, loadProjectData]);

  const project = getProject(projectId);
  const workUnits = getProjectWorkUnits(projectId);
  const users = getAllUsers();
  // Lấy userProject theo projectId
  const allUserProjects = getAllUserProjects ? getAllUserProjects() : [];
  const projectIdStr = String(projectId);
  // Filter userProject by projectId
  const projectUserProjects = allUserProjects.filter(up => {
    const pid = String(up.projectId || '').trim();
    return pid === projectIdStr;
  });
  // Get userIds
  const memberIds = projectUserProjects.map(up => String(up.userId || '').trim());
  // Filter users by memberIds
  const projectMembers = users.filter(u => {
    const userId = String(u.id || u._id || '').trim();
    return memberIds.includes(userId);
  });

  if (!project) return null;

  const handleDrop = (taskId: string, newWorkUnitId: string) => {
    updateTask(taskId, { workUnitId: newWorkUnitId });
  };

  const handleAddTask = (workUnitId: string) => {
    setCreateWorkUnitId(workUnitId);
    setShowCreateTask(true);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    const normalizedWorkUnitId = String(createWorkUnitId).trim();
    const tasksInUnit = getTasksByWorkUnit(normalizedWorkUnitId);
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

  // Send notification when assigning
  const handleTaskChange = (field: keyof Task, value: any) => {
    setTaskChanges(prev => ({ ...prev, [field]: value }));

    if (field === 'assigneeId' && selectedTask) {
      const assignedUser = users.find(u => String(u.id || u._id) === String(value));
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

  const handleSaveTask = () => {
    if (selectedTask && Object.keys(taskChanges).length > 0) {
      updateTask(selectedTaskId, taskChanges);
      setTaskChanges({});
    }
    setSelectedTask(null);
  };

  const handleCloseTaskModal = () => {
    if (Object.keys(taskChanges).length > 0) {
      setShowUnsavedChanges(true);
    } else {
      setSelectedTask(null);
      setTaskChanges({});
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedChanges(false);
    setSelectedTask(null);
    setTaskChanges({});
  };

  const handleCancelClose = () => {
    setShowUnsavedChanges(false);
  };

  const selectedTaskId = selectedTask?.id || selectedTask?._id || '';
  const selectedTaskComments = selectedTask ? getTaskComments(selectedTaskId) : [];
  const selectedTaskAttachments = selectedTask ? getTaskAttachments(selectedTaskId) : [];


  // Comments mapping
  // Comments mapping: lấy đúng user từ allUsers
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
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600 capitalize">{project.methodology} Board</p>
              </div>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
              {workUnits.map((workUnit) => {
                const workUnitId = workUnit.id || workUnit._id || '';
                const tasks = getTasksByWorkUnit(workUnitId);
                return (
                  <div key={workUnitId} className="bg-gray-100 p-4 rounded-lg">
                    <Column
                      workUnit={workUnit}
                      tasks={tasks}
                      onTaskClick={handleTaskClick}
                      onDrop={handleDrop}
                      onAddTask={handleAddTask}
                      users={users}
                    />
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
                      value={taskChanges.status ?? selectedTask.status}
                      onChange={(e) => handleTaskChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                    <select
                      value={(() => {
                        // Nếu taskChanges có assigneeId thì dùng luôn
                        if (taskChanges.assigneeId) return String(taskChanges.assigneeId);

                        // Nếu selectedTask.assigneeId là object (populate) thì lấy id hoặc _id
                        if (typeof selectedTask.assigneeId === 'object' && selectedTask.assigneeId !== null) {
                          return String(selectedTask.assigneeId.id || selectedTask.assigneeId._id || '');
                        }

                        // Nếu là string thì trả về string
                        return String(selectedTask.assigneeId || '');
                      })()}
                      onChange={(e) =>
                        handleTaskChange('assigneeId', e.target.value !== '' ? String(e.target.value) : undefined)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {projectMembers.map((u) => {
                        const userId = String(u.id || u._id || '');
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
                      onClick={handleLogTime}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Log Time
                    </button>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Attachments ({selectedTaskAttachments.length})</h3>
                  {selectedTaskAttachments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTaskAttachments.map(att => (
                        <div key={att.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Paperclip className="w-4 h-4 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{att.fileName}</p>
                            <p className="text-xs text-gray-600">{(att.fileSize / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No attachments</p>
                  )}
                </div>

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
                      onClick={handleAddComment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
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
