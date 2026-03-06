import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Project,
  UserProject,
  WorkUnit,
  Task,
  Comment,
  Attachment,
  Notification,
  AuditLog,
  User,
  Methodology,
  TaskStatus,
  WorkUnitType,
} from '../types';
import { useAuth } from './AuthContext';

// @ts-ignore - Vite environment variable
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:5000/api';

interface DataContextType {
  // Projects
  projects: Project[];
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'isArchived'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  getUserProjects: (userId: string) => Project[];

  // UserProjects
  userProjects: UserProject[];
  addUserToProject: (userId: string, projectId: string, role: string) => void;
  removeUserFromProject: (userId: string, projectId: string) => void;
  getProjectMembers: (projectId: string) => UserProject[];

  // WorkUnits
  workUnits: WorkUnit[];
  createWorkUnit: (data: Omit<WorkUnit, 'id'>) => Promise<WorkUnit>;
  updateWorkUnit: (id: string, updates: Partial<WorkUnit>) => void;
  deleteWorkUnit: (id: string) => void;
  getProjectWorkUnits: (projectId: string) => WorkUnit[];

  // Tasks
  tasks: Task[];
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksByWorkUnit: (workUnitId: string) => Task[];
  getTasksByProject: (projectId: string) => Task[];

  // Comments
  comments: Comment[];
  addComment: (taskId: string, content: string, parentId?: string) => void;
  getTaskComments: (taskId: string) => Comment[];

  // Attachments
  attachments: Attachment[];
  addAttachment: (taskId: string, fileName: string, fileUrl: string, fileSize: number) => void;
  removeAttachment: (id: string) => void;
  getTaskAttachments: (taskId: string) => Attachment[];

  // Notifications
  notifications: Notification[];
  markAsRead: (id: string) => void;
  getUserNotifications: (userId: string) => Notification[];

  // Users (for admin)
  users: User[];
  getAllUsers: () => User[];
  updateUserData: (id: string, updates: Partial<User>) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, entity: string, entityId: string, details: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load data from API on mount and when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const userId = user.id || user._id;
        const [
          projectsRes,
          userProjectsRes,
          workUnitsRes,
          tasksRes,
          commentsRes,
          attachmentsRes,
          usersRes,
          notificationsRes,
          auditLogsRes,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/projects`),
          fetch(`${API_BASE_URL}/user-projects`),
          fetch(`${API_BASE_URL}/work-units`),
          fetch(`${API_BASE_URL}/tasks`),
          fetch(`${API_BASE_URL}/comments`),
          fetch(`${API_BASE_URL}/attachments`),
          fetch(`${API_BASE_URL}/users`),
          fetch(`${API_BASE_URL}/notifications/user/${userId}`),
          fetch(`${API_BASE_URL}/audit-logs`),
        ]);

        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (userProjectsRes.ok) setUserProjects(await userProjectsRes.json());
        if (workUnitsRes.ok) setWorkUnits(await workUnitsRes.json());
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (commentsRes.ok) setComments(await commentsRes.json());
        if (attachmentsRes.ok) setAttachments(await attachmentsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (notificationsRes.ok) setNotifications(await notificationsRes.json());
        if (auditLogsRes.ok) setAuditLogs(await auditLogsRes.json());
      } catch (error) {
        console.error('Failed to load data from API:', error);
      }
    };

    loadData();
  }, [user]);

  // Project methods
  const createProject = async (data: Omit<Project, 'id' | 'createdAt' | 'isArchived'>): Promise<Project> => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...data,
          createdBy: user?.id || user?._id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }

      const newProject = await response.json();
      const projectWithId = { ...newProject, id: newProject._id || newProject.id };
      setProjects(prev => [...prev, projectWithId]);

      // Add the creator as an Admin in UserProject
      const userProjectData = {
        userId: user?.id || user?._id,
        projectId: projectWithId.id || projectWithId._id,
        role: 'Admin',
      };
      setUserProjects(prev => [...prev, userProjectData as any]);

      // Create default work units based on methodology
      createDefaultWorkUnits(projectWithId);

      return projectWithId;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  };

  const createDefaultWorkUnits = async (project: Project) => {
    let defaultUnits: { name: string; type: WorkUnitType; order: number; goal?: string }[] = [];

    if (project.methodology === 'agile') {
      defaultUnits = [
        { name: 'Backlog', type: 'sprint', order: 0 },
        { name: 'Sprint 1', type: 'sprint', order: 1, goal: 'First sprint' },
      ];
    } else if (project.methodology === 'kanban') {
      defaultUnits = [
        { name: 'To Do', type: 'column', order: 1 },
        { name: 'In Progress', type: 'column', order: 2 },
        { name: 'Done', type: 'column', order: 3 },
      ];
    } else if (project.methodology === 'waterfall') {
      defaultUnits = [
        { name: 'Requirements', type: 'phase', order: 1 },
        { name: 'Design', type: 'phase', order: 2 },
        { name: 'Implementation', type: 'phase', order: 3 },
        { name: 'Testing', type: 'phase', order: 4 },
        { name: 'Deployment', type: 'phase', order: 5 },
      ];
    }

    try {
      for (const unit of defaultUnits) {
        await createWorkUnit({
          projectId: project.id,
          ...unit,
        } as any);
      }
    } catch (error) {
      console.error('Failed to create default work units:', error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update project');

      const updated = await response.json();
      setProjects(prev => prev.map(p => (p.id === id || p._id === id) ? { ...updated, id: updated._id || updated.id } : p));
    } catch (error) {
      console.error('Update project error:', error);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete project');

      setProjects(prev => prev.filter(p => p.id !== id && p._id !== id));
    } catch (error) {
      console.error('Delete project error:', error);
    }
  };

  const getProject = (id: string) => {
    return projects.find(p => p.id === id || p._id === id) as Project | undefined;
  };

  const getUserProjects = (userId: string): Project[] => {
    const userProjectIds = userProjects
      .filter(up => up.userId === userId || up.userId === userId)
      .map(up => up.projectId)
      .filter((id): id is string => id !== undefined);
    return projects.filter(p => {
      const projectId = p.id || p._id;
      return projectId && userProjectIds.includes(projectId) && !p.isArchived;
    });
  };

  // UserProject methods
  const addUserToProject = async (userId: string, projectId: string, role: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, projectId, role }),
      });

      if (!response.ok) throw new Error('Failed to add user to project');

      const newUserProject = await response.json();
      setUserProjects(prev => [...prev, newUserProject]);
    } catch (error) {
      console.error('Add user to project error:', error);
    }
  };

  const removeUserFromProject = async (userId: string, projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-projects/${userId}/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove user from project');

      setUserProjects(prev => prev.filter(up => !(up.userId === userId && up.projectId === projectId)));
    } catch (error) {
      console.error('Remove user from project error:', error);
    }
  };

  const getProjectMembers = (projectId: string) => {
    return userProjects.filter(up => up.projectId === projectId);
  };

  // WorkUnit methods
  const createWorkUnit = async (data: Omit<WorkUnit, 'id'>): Promise<WorkUnit> => {
    try {
      const response = await fetch(`${API_BASE_URL}/work-units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create work unit');

      const newWorkUnit = await response.json();
      const unitWithId = { ...newWorkUnit, id: newWorkUnit._id || newWorkUnit.id };
      setWorkUnits(prev => [...prev, unitWithId]);
      return unitWithId;
    } catch (error) {
      console.error('Create work unit error:', error);
      throw error;
    }
  };

  const updateWorkUnit = async (id: string, updates: Partial<WorkUnit>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/work-units/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update work unit');

      const updated = await response.json();
      setWorkUnits(prev => prev.map(wu => wu.id === id || wu._id === id ? { ...updated, id: updated._id || updated.id } : wu));
    } catch (error) {
      console.error('Update work unit error:', error);
    }
  };

  const deleteWorkUnit = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/work-units/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete work unit');

      setWorkUnits(prev => prev.filter(wu => wu.id !== id && wu._id !== id));
    } catch (error) {
      console.error('Delete work unit error:', error);
    }
  };

  const getProjectWorkUnits = (projectId: string) => {
    return workUnits
      .filter(wu => wu.projectId === projectId || wu.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  };

  // Task methods
  const createTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          createdBy: user?.id || user?._id,
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      const newTask = await response.json();
      const taskWithId = { ...newTask, id: newTask._id || newTask.id };
      setTasks(prev => [...prev, taskWithId]);
      return taskWithId;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update task');

      const updated = await response.json();
      setTasks(prev => prev.map(t => t.id === id || t._id === id ? { ...updated, id: updated._id || updated.id } : t));
    } catch (error) {
      console.error('Update task error:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setTasks(prev => prev.filter(t => t.id !== id && t._id !== id));
    } catch (error) {
      console.error('Delete task error:', error);
    }
  };

  const getTasksByWorkUnit = (workUnitId: string) => {
    return tasks
      .filter(t => t.workUnitId === workUnitId || t.workUnitId === workUnitId)
      .sort((a, b) => a.order - b.order);
  };

  const getTasksByProject = (projectId: string) => {
    return tasks.filter(t => t.projectId === projectId || t.projectId === projectId);
  };

  // Comment methods
  const addComment = async (taskId: string, content: string, parentId?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          userId: user?.id || user?._id,
          content,
          parentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const newComment = await response.json();
      const commentWithId = { ...newComment, id: newComment._id || newComment.id };
      setComments(prev => [...prev, commentWithId]);
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  const getTaskComments = (taskId: string) => {
    return comments
      .filter(c => c.taskId === taskId || c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  // Attachment methods
  const addAttachment = async (taskId: string, fileName: string, fileUrl: string, fileSize: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          fileName,
          fileUrl,
          fileSize,
          uploadedBy: user?.id || user?._id,
        }),
      });

      if (!response.ok) throw new Error('Failed to add attachment');

      const newAttachment = await response.json();
      const attachmentWithId = { ...newAttachment, id: newAttachment._id || newAttachment.id };
      setAttachments(prev => [...prev, attachmentWithId]);
    } catch (error) {
      console.error('Add attachment error:', error);
    }
  };

  const removeAttachment = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attachments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete attachment');

      setAttachments(prev => prev.filter(a => a.id !== id && a._id !== id));
    } catch (error) {
      console.error('Delete attachment error:', error);
    }
  };

  const getTaskAttachments = (taskId: string) => {
    return attachments.filter(a => a.taskId === taskId || a.taskId === taskId);
  };

  // Notification methods
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');

      const updated = await response.json();
      setNotifications(prev => prev.map(n => n.id === id || n._id === id ? { ...updated, id: updated._id || updated.id } : n));
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  };

  const getUserNotifications = (userId: string) => {
    return notifications
      .filter(n => n.userId === userId || n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // User methods
  const getAllUsers = () => users;

  const updateUserData = async (id: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update user');

      const updated = await response.json();
      setUsers(prev => prev.map(u => u.id === id || u._id === id ? { ...updated, id: updated._id || updated.id } : u));
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  // Audit log methods
  const addAuditLog = async (action: string, entity: string, entityId: string, details: string) => {
    try {
      if (!user) return;

      const response = await fetch(`${API_BASE_URL}/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || user._id,
          action,
          entity,
          entityId,
          details,
        }),
      });

      if (!response.ok) throw new Error('Failed to create audit log');

      const newLog = await response.json();
      const logWithId = { ...newLog, id: newLog._id || newLog.id };
      setAuditLogs(prev => [...prev, logWithId]);
    } catch (error) {
      console.error('Add audit log error:', error);
    }
  };

  const value: DataContextType = {
    projects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    getUserProjects,
    userProjects,
    addUserToProject,
    removeUserFromProject,
    getProjectMembers,
    workUnits,
    createWorkUnit,
    updateWorkUnit,
    deleteWorkUnit,
    getProjectWorkUnits,
    tasks,
    createTask,
    updateTask,
    deleteTask,
    getTasksByWorkUnit,
    getTasksByProject,
    comments,
    addComment,
    getTaskComments,
    attachments,
    addAttachment,
    removeAttachment,
    getTaskAttachments,
    notifications,
    markAsRead,
    getUserNotifications,
    users,
    getAllUsers,
    updateUserData,
    auditLogs,
    addAuditLog,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
