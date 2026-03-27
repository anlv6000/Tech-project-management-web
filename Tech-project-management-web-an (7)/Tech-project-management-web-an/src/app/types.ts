// Database types matching the 7 tables

export type UserRole = "user" | "admin";
export type ProjectRole =
  | "projectAdmin"
  | "projectManager"
  | "member"
  | "viewer";
export type Methodology = "agile" | "kanban" | "waterfall";
export type TaskStatus = "todo" | "in-progress" | "done" | "backlog";
export type WorkUnitType = "sprint" | "column" | "phase";

export interface User {
  id?: string;
  _id?: string;
  email: string;
  fullName: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  updatedAt?: string;
  expiresAt?: string;
}

export interface Project {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  methodology: Methodology;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  isArchived: boolean;
  isCompleted: boolean;
  updatedAt?: string;
}

export interface UserProject {
  id?: string;
  _id?: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface WorkUnit {
  id?: string;
  _id?: string;
  projectId: string;
  name: string;
  type: WorkUnitType;
  order: number;
  startDate?: string;
  endDate?: string;
  goal?: string;
  isDone?: boolean;
  status?: 'planning' | 'active' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id?: string;
  _id?: string;
  projectId: string;
  workUnitId: string;
  title: string;
  description: string;
  assigneeId?: string;
  status: TaskStatus;
  deadline?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  timeSpent?: number;
  parentId?: string;
  type?: string;
  storyPoints?: number;
  issueType?: 'epic' | 'user-story' | 'task' | 'bug' | 'subtask';
  relatedTasks?: {
    taskId: string;
    type: string;
  }[];
}

export interface Comment {
  id?: string;
  _id?: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  parentId?: string;
  updatedAt?: string;
}

export interface Attachment {
  id?: string;
  _id?: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Notification {
  id?: string;
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: "task" | "comment" | "project" | "system";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  _id?: string;
  id?: string;
  userId:
  | string
  | {
    _id?: string;
    id?: string;
    fullName?: string;
    email?: string;
  };
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
}