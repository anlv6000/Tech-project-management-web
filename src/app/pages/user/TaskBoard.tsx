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

  const assignee = users.find(u => (u.id || u._id) === task.assigneeId);
  const { getTaskComments, getTaskAttachments } = useData();
  const taskId = task.id || task._id || '';
  const comments = getTaskComments(taskId);
  const attachments = getTaskAttachments(taskId);

  return (
    <div
      ref={drag as any}
      onClick={onClick}
      className={`bg-white p-4 rounded-lg border hover:shadow-md cursor-pointer transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
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
  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    drop: (item: { id: string; workUnitId: string }) => {
      if (item.workUnitId !== workUnit.id) {
        onDrop(item.id, workUnit.id);
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
          onClick={() => onAddTask(workUnit.id)}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div
        ref={drop as any}
        className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-transparent'
        }`}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
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
    addAttachment,
  } = useData();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createWorkUnitId, setCreateWorkUnitId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newComment, setNewComment] = useState('');
  const [timeLog, setTimeLog] = useState('');

  if (!projectId || !user) return null;

  const project = getProject(projectId);
  const workUnits = getProjectWorkUnits(projectId);
  const users = getAllUsers();

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

    const tasksInUnit = getTasksByWorkUnit(createWorkUnitId);
    createTask({
      projectId: projectId || '',
      workUnitId: createWorkUnitId,
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
    if (!selectedTask || !newComment.trim()) return;
    addComment(selectedTask.id || selectedTask._id || '', newComment);
    setNewComment('');
  };

  const handleLogTime = () => {
    if (!selectedTask || !timeLog) return;
    const hours = parseFloat(timeLog);
    if (isNaN(hours)) return;
    
    const currentTime = selectedTask.timeSpent || 0;
    updateTask(selectedTask.id || selectedTask._id || '', { timeSpent: currentTime + hours });
    setTimeLog('');
  };

  const selectedTaskId = selectedTask?.id || selectedTask?._id || '';
  const selectedTaskComments = selectedTask ? getTaskComments(selectedTaskId) : [];
  const selectedTaskAttachments = selectedTask ? getTaskAttachments(selectedTaskId) : [];

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
                  <div key={workUnit.id} className="bg-gray-100 p-4 rounded-lg">
                    <Column
                      workUnit={workUnit}
                      tasks={tasks}
                      onTaskClick={setSelectedTask}
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
                  onClick={() => setSelectedTask(null)}
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
                      value={selectedTask.status}
                      onChange={(e) => updateTask(selectedTaskId, { status: e.target.value as any })}
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
                      value={selectedTask.assigneeId || ''}
                      onChange={(e) => updateTask(selectedTaskId, { assigneeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
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
                  <h3 className="font-medium text-gray-900 mb-3">Comments ({selectedTaskComments.length})</h3>
                  <div className="space-y-3 mb-4">
                    {selectedTaskComments.map(comment => {
                      const commentUser = users.find(u => u.id === comment.userId);
                      return (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm text-blue-600 font-medium">
                              {commentUser?.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{commentUser?.fullName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })}
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
