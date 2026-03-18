import { ProjectRole, Task } from "../../types";

const normalizeRole = (role: any): string => {
  if (!role) return "";
  if (role === "Admin") return "projectAdmin";
  if (role === "PM") return "pm";
  if (role === "Lead") return "pm";
  if (role === "Manager") return "pm";
  if (role === "Member") return "member";
  if (role === "Viewer") return "viewer";
  return String(role);
};

const getIdString = (value: any): string => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

export function canManageProject(projectRole: ProjectRole | string): boolean {
  return normalizeRole(projectRole) === "projectAdmin";
}

export function canManageMembers(projectRole: ProjectRole | string): boolean {
  return normalizeRole(projectRole) === "projectAdmin";
}

export function canCompleteProject(projectRole: ProjectRole | string): boolean {
  return normalizeRole(projectRole) === "projectAdmin";
}

export function canCreateWorkUnit(projectRole: ProjectRole | string): boolean {
  return ["projectAdmin", "pm"].includes(normalizeRole(projectRole));
}

export function canCreateTask(projectRole: ProjectRole | string): boolean {
  return ["projectAdmin", "pm"].includes(normalizeRole(projectRole));
}

export function canEditTask(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);

  if (["projectAdmin", "pm"].includes(normalizedRole)) return true;

  const assigneeId = getIdString(task.assigneeId);
  return normalizedRole === "member" && assigneeId === String(userId);
}

export function canUpdateStatus(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);

  if (["projectAdmin", "pm"].includes(normalizedRole)) return true;

  const assigneeId = getIdString(task.assigneeId);
  return normalizedRole === "member" && assigneeId === String(userId);
}

export function canAssignTask(projectRole: ProjectRole | string): boolean {
  return ["projectAdmin", "pm"].includes(normalizeRole(projectRole));
}

export function canSaveTask(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);

  if (["projectAdmin", "pm"].includes(normalizedRole)) return true;

  const assigneeId = getIdString(task.assigneeId);
  return normalizedRole === "member" && assigneeId === String(userId);
}

export function canLogWork(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);

  if (["projectAdmin", "pm"].includes(normalizedRole)) return true;

  const assigneeId = getIdString(task.assigneeId);
  return normalizedRole === "member" && assigneeId === String(userId);
}

export function canComment(projectRole: ProjectRole | string): boolean {
  return ["projectAdmin", "pm", "member"].includes(normalizeRole(projectRole));
}

export function canUploadAttachment(projectRole: ProjectRole | string): boolean {
  return ["projectAdmin", "pm", "member"].includes(normalizeRole(projectRole));
}

export function canDeleteAttachment(
  projectRole: ProjectRole | string,
  uploadedBy?: any,
  userId?: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);

  if (["projectAdmin", "pm"].includes(normalizedRole)) return true;

  const uploaderId = getIdString(uploadedBy);
  return normalizedRole === "member" && uploaderId === String(userId || "");
}

export function canCreateSubTask(projectRole: ProjectRole | string): boolean {
  return ["projectAdmin", "pm"].includes(normalizeRole(projectRole));
}

export function canUpdateSubTask(
  subTask: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);

  if (["projectAdmin", "pm"].includes(normalizedRole)) return true;

  const assigneeId = getIdString(subTask.assigneeId);
  return normalizedRole === "member" && assigneeId === String(userId);
}

export function canDeleteSubTask(projectRole: ProjectRole | string): boolean {
  return ["projectAdmin", "pm"].includes(normalizeRole(projectRole));
}