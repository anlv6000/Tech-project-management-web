import { ProjectRole, Task } from "../../types";

type NormalizedProjectRole =
  | "projectAdmin"
  | "projectManager"
  | "member"
  | "viewer";

const normalizeRole = (role: any): NormalizedProjectRole | null => {
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

const getIdString = (value: any): string => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

export function canManageProject(projectRole: ProjectRole | string | null | undefined): boolean {
  return normalizeRole(projectRole) === "projectAdmin";
}

export function canManageMembers(projectRole: ProjectRole | string | null | undefined): boolean {
  return normalizeRole(projectRole) === "projectAdmin";
}

export function canCompleteProject(projectRole: ProjectRole | string | null | undefined): boolean {
  return normalizeRole(projectRole) === "projectAdmin";
}

export function canCreateWorkUnit(projectRole: ProjectRole | string | null | undefined): boolean {
  const normalizedRole = normalizeRole(projectRole);
  return (
    normalizedRole === "projectAdmin" ||
    normalizedRole === "projectManager"
  );
}

export function canCreateTask(projectRole: ProjectRole | string | null | undefined): boolean {
  const normalizedRole = normalizeRole(projectRole);
  return (
    normalizedRole === "projectAdmin" ||
    normalizedRole === "projectManager" ||
    normalizedRole === "member"
  );
}

export function canEditTask(
  task: Task,
  projectRole: ProjectRole | string | null | undefined,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);
  if (!normalizedRole) return false;

  if (
    normalizedRole === "projectAdmin" ||
    normalizedRole === "projectManager"
  ) {
    return true;
  }

  const assigneeId = getIdString(task.assigneeId);
  return normalizedRole === "member" && assigneeId === String(userId);
}


export function canAssignTask(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);

  // Admin/Manager luôn được phép
  if (
    normalizedRole === "projectAdmin" ||
    normalizedRole === "projectManager"
  ) {
    return true;
  }

  // Người tạo task cũng được phép
  const creatorId = getIdString(task.createdBy);
  return creatorId === String(userId);
}



export function canMoveTask(projectRole: ProjectRole | string): boolean {
  const normalizedRole = normalizeRole(projectRole);
  return (
    normalizedRole === "projectAdmin" ||
    normalizedRole === "projectManager"
  );
}


export function canComment(projectRole: ProjectRole | string): boolean {
  const normalizedRole = normalizeRole(projectRole);
  return (
    normalizedRole === "projectAdmin" ||
    normalizedRole === "projectManager" ||
    normalizedRole === "member"
  );
}

export function canUploadAttachment(projectRole: ProjectRole | string): boolean {
  const normalizedRole = normalizeRole(projectRole);
  return (
    normalizedRole === "projectAdmin" ||
    normalizedRole === "projectManager" ||
    normalizedRole === "member"
  );
}

export function canDeleteAttachment(
  projectRole: ProjectRole | string,
  uploadedBy?: any,
  userId?: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);
  if (!normalizedRole) return false;

  if (
    normalizedRole === "projectAdmin" ||
    normalizedRole === "projectManager"
  ) {
    return true;
  }

  const uploaderId = getIdString(uploadedBy);
  return normalizedRole === "member" && uploaderId === String(userId || "");
}

export function canCreateSubTask(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);
  if (normalizedRole === "projectAdmin" || normalizedRole === "projectManager") {
    return true;
  }
  const creatorId = getIdString(task.createdBy);
  return normalizedRole === "member" && creatorId === String(userId);
}

export function canUpdateSubTask(
  subTask: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);
  if (normalizedRole === "projectAdmin" || normalizedRole === "projectManager") {
    return true;
  }
  const assigneeId = getIdString(subTask.assigneeId);
  const creatorId = getIdString(subTask.createdBy);
  return normalizedRole === "member" && (assigneeId === String(userId) || creatorId === String(userId));
}

export function canDeleteSubTask(
  subTask: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);
  if (normalizedRole === "projectAdmin" || normalizedRole === "projectManager") {
    return true;
  }
  const creatorId = getIdString(subTask.createdBy);
  return normalizedRole === "member" && creatorId === String(userId);
}

export function canSaveTask(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);
  if (normalizedRole === "projectAdmin" || normalizedRole === "projectManager") {
    return true;
  }
  const assigneeId = getIdString(task.assigneeId);
  const creatorId = getIdString(task.createdBy);
  return normalizedRole === "member" && (assigneeId === String(userId) || creatorId === String(userId));
}

export function canLogWork(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);
  if (normalizedRole === "projectAdmin" || normalizedRole === "projectManager") {
    return true;
  }
  const assigneeId = getIdString(task.assigneeId);
  const creatorId = getIdString(task.createdBy);
  return normalizedRole === "member" && (assigneeId === String(userId) || creatorId === String(userId));
}

export function canUpdateStatus(
  task: Task,
  projectRole: ProjectRole | string,
  userId: string,
): boolean {
  const normalizedRole = normalizeRole(projectRole);
  if (normalizedRole === "projectAdmin" || normalizedRole === "projectManager") {
    return true;
  }
  const assigneeId = getIdString(task.assigneeId);
  const creatorId = getIdString(task.createdBy);
  return normalizedRole === "member" && (assigneeId === String(userId) || creatorId === String(userId));
}
export function canEditPhase(projectRole: ProjectRole | string | null | undefined): boolean {
  return normalizeRole(projectRole) === "projectAdmin";
}

export function canMarkPhaseDone(projectRole: ProjectRole | string | null | undefined): boolean {
  return normalizeRole(projectRole) === "projectAdmin";
}