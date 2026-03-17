// permissions.ts
import { ProjectRole, Task } from "../../types";

/**
 * Sprint / WorkUnit
 */
export function canCreateWorkUnit(projectRole: ProjectRole): boolean {
  return ["projectAdmin", "pm"].includes(projectRole);
}

/**
 * Task
 */
export function canCreateTask(projectRole: ProjectRole): boolean {
  return ["projectAdmin", "pm"].includes(projectRole);
}

export function canEditTask(task: Task, projectRole: ProjectRole, userId: string): boolean {
  if (["projectAdmin", "pm"].includes(projectRole)) return true;
  if (projectRole === "member" && task.assigneeId === userId) return true;
  return false;
}

export function canUpdateStatus(task: Task, projectRole: ProjectRole, userId: string): boolean {
  if (["projectAdmin", "pm"].includes(projectRole)) return true;
  if (projectRole === "member" && task.assigneeId === userId) return true;
  return false;
}

export function canAssignTask(projectRole: ProjectRole): boolean {
  return ["projectAdmin", "pm"].includes(projectRole);
}

export function canSaveTask(task: Task, projectRole: ProjectRole, userId: string): boolean {
  if (["projectAdmin", "pm"].includes(projectRole)) return true;
  if (projectRole === "member" && task.assigneeId === userId) return true;
  return false;
}

/**
 * Time Tracking
 */
export function canLogWork(task: Task, projectRole: ProjectRole, userId: string): boolean {
  if (["projectAdmin", "pm"].includes(projectRole)) return true; // optional
  if (projectRole === "member" && task.assigneeId === userId) return true;
  return false;
}

/**
 * Comments
 */
export function canComment(projectRole: ProjectRole): boolean {
  return ["projectAdmin", "pm", "member"].includes(projectRole);
}

/**
 * Attachments
 */
export function canUploadAttachment(projectRole: ProjectRole): boolean {
  return ["projectAdmin", "pm", "member"].includes(projectRole);
}

export function canDeleteAttachment(projectRole: ProjectRole): boolean {
  return ["projectAdmin", "pm"].includes(projectRole);
}

/**
 * Sub-task
 */
export function canCreateSubTask(projectRole: ProjectRole): boolean {
  return ["projectAdmin", "pm"].includes(projectRole);
}

export function canUpdateSubTask(subTask: Task, projectRole: ProjectRole, userId: string): boolean {
  if (["projectAdmin", "pm"].includes(projectRole)) return true;
  if (projectRole === "member" && subTask.assigneeId === userId) return true;
  return false;
}

export function canDeleteSubTask(projectRole: ProjectRole): boolean {
  return ["projectAdmin", "pm"].includes(projectRole);
}
