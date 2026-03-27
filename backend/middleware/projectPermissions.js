import UserProject from "../models/UserProject.js";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import Attachment from "../models/Attachment.js";
import WorkUnit from "../models/WorkUnit.js";

const ROLE_MAP = {
  projectAdmin: "projectAdmin",
  projectManager: "projectManager",
  member: "member",
  viewer: "viewer",

  // fallback for old data
  pm: "projectManager",
  PM: "projectManager",
  Lead: "projectManager",
  Manager: "projectManager",
  Admin: "projectAdmin",
  "Project Admin": "projectAdmin",
  "Project Manager": "projectManager",
  Member: "member",
  Viewer: "viewer",
};

export const normalizeProjectRole = (role) => {
  if (!role) return "member";
  return ROLE_MAP[String(role).trim()] || "member";
};

const getIdString = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

export const getProjectMembership = async (userId, projectId) => {
  const membership = await UserProject.findOne({
    userId: getIdString(userId),
    projectId: getIdString(projectId),
  }).lean();

  if (!membership) return null;

  return {
    ...membership,
    role: normalizeProjectRole(membership.role),
  };
};

const isSystemAdmin = (req) => req.user?.role === "admin";

export const requireProjectRole =
  (allowedRoles = [], projectIdResolver) =>
  async (req, res, next) => {
    try {
      if (isSystemAdmin(req)) {
        return next();
      }

      const resolvedProjectId = projectIdResolver
        ? await projectIdResolver(req)
        : req.params.projectId || req.params.id || req.body.projectId;

      if (!resolvedProjectId) {
        return res.status(400).json({ message: "Project id is required" });
      }

      const membership = await getProjectMembership(
        req.user?._id || req.user?.id,
        resolvedProjectId,
      );

      if (!membership) {
        return res
          .status(403)
          .json({ message: "You are not a member of this project" });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res
          .status(403)
          .json({ message: "You do not have permission for this action" });
      }

      req.projectMembership = membership;
      req.projectRole = membership.role;
      req.projectId = getIdString(resolvedProjectId);

      next();
    } catch (error) {
      console.error("requireProjectRole error:", error);
      res.status(500).json({ message: error.message });
    }
  };

export const attachTaskToRequest = async (req, res, next) => {
  try {
    const taskId = req.params.id || req.params.taskId || req.body.taskId;

    if (!taskId) {
      return res.status(400).json({ message: "Task id is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    req.task = task;
    next();
  } catch (error) {
    console.error("attachTaskToRequest error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requireTaskCreatePermission = async (req, res, next) => {
  try {
    if (isSystemAdmin(req)) return next();

    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ message: "Project id is required" });
    }

    const membership = await getProjectMembership(
      req.user?._id || req.user?.id,
      projectId,
    );

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    if (!["projectAdmin", "projectManager"].includes(membership.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to create tasks" });
    }

    req.projectMembership = membership;
    req.projectRole = membership.role;
    next();
  } catch (error) {
    console.error("requireTaskCreatePermission error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requireTaskUpdatePermission = async (req, res, next) => {
  try {
    if (isSystemAdmin(req)) return next();

    const task = req.task;
    const membership = await getProjectMembership(
      req.user?._id || req.user?.id,
      task.projectId,
    );

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    const userId = getIdString(req.user?._id || req.user?.id);
    const assigneeId = getIdString(task.assigneeId);

    if (["projectAdmin", "projectManager"].includes(membership.role)) {
      req.projectMembership = membership;
      req.projectRole = membership.role;
      return next();
    }

    if (membership.role === "member" && assigneeId === userId) {
      const forbiddenFields = [
        "projectId",
        "workUnitId",
        "assigneeId",
        "createdBy",
        "order",
        "type",
      ];

      const attemptedForbiddenFields = forbiddenFields.filter(
        (field) => field in req.body,
      );

      if (attemptedForbiddenFields.length > 0) {
        return res.status(403).json({
          message: `Members cannot update these fields: ${attemptedForbiddenFields.join(", ")}`,
        });
      }

      req.projectMembership = membership;
      req.projectRole = membership.role;
      return next();
    }

    return res
      .status(403)
      .json({ message: "You do not have permission to update this task" });
  } catch (error) {
    console.error("requireTaskUpdatePermission error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requireTaskDeletePermission = async (req, res, next) => {
  try {
    if (isSystemAdmin(req)) return next();

    const task = req.task;
    const membership = await getProjectMembership(
      req.user?._id || req.user?.id,
      task.projectId,
    );

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    if (!["projectAdmin", "projectManager"].includes(membership.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this task" });
    }

    req.projectMembership = membership;
    req.projectRole = membership.role;
    next();
  } catch (error) {
    console.error("requireTaskDeletePermission error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const attachCommentToRequest = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    if (!commentId) {
      return res.status(400).json({ message: "Comment id is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    req.comment = comment;
    next();
  } catch (error) {
    console.error("attachCommentToRequest error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requireCommentCreatePermission = async (req, res, next) => {
  try {
    if (isSystemAdmin(req)) return next();

    const taskId = req.body.taskId;
    if (!taskId) {
      return res.status(400).json({ message: "Task id is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    req.task = task;

    const membership = await getProjectMembership(
      req.user?._id || req.user?.id,
      task.projectId,
    );

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    if (
      !["projectAdmin", "projectManager", "member"].includes(membership.role)
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to comment" });
    }

    req.projectMembership = membership;
    req.projectRole = membership.role;
    next();
  } catch (error) {
    console.error("requireCommentCreatePermission error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requireCommentModifyPermission = async (req, res, next) => {
  try {
    if (isSystemAdmin(req)) return next();

    const comment = req.comment;
    const task = await Task.findById(comment.taskId);

    if (!task) {
      return res
        .status(404)
        .json({ message: "Task not found for this comment" });
    }

    req.task = task;

    const membership = await getProjectMembership(
      req.user?._id || req.user?.id,
      task.projectId,
    );

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    const userId = getIdString(req.user?._id || req.user?.id);
    const ownerId = getIdString(comment.userId);

    if (
      ["projectAdmin", "projectManager"].includes(membership.role) ||
      ownerId === userId
    ) {
      req.projectMembership = membership;
      req.projectRole = membership.role;
      return next();
    }

    return res
      .status(403)
      .json({ message: "You do not have permission to modify this comment" });
  } catch (error) {
    console.error("requireCommentModifyPermission error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const attachAttachmentToRequest = async (req, res, next) => {
  try {
    const attachmentId = req.params.id;
    if (!attachmentId) {
      return res.status(400).json({ message: "Attachment id is required" });
    }

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    req.attachment = attachment;
    next();
  } catch (error) {
    console.error("attachAttachmentToRequest error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requireAttachmentCreatePermission = async (req, res, next) => {
  try {
    if (isSystemAdmin(req)) return next();

    const taskId = req.body.taskId;
    if (!taskId) {
      return res.status(400).json({ message: "Task id is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    req.task = task;

    const membership = await getProjectMembership(
      req.user?._id || req.user?.id,
      task.projectId,
    );

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    if (
      !["projectAdmin", "projectManager", "member"].includes(membership.role)
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to upload attachments" });
    }

    req.projectMembership = membership;
    req.projectRole = membership.role;
    next();
  } catch (error) {
    console.error("requireAttachmentCreatePermission error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requireAttachmentDeletePermission = async (req, res, next) => {
  try {
    if (isSystemAdmin(req)) return next();

    const attachment = req.attachment;
    const task = await Task.findById(attachment.taskId);

    if (!task) {
      return res
        .status(404)
        .json({ message: "Task not found for this attachment" });
    }

    req.task = task;

    const membership = await getProjectMembership(
      req.user?._id || req.user?.id,
      task.projectId,
    );

    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    const userId = getIdString(req.user?._id || req.user?.id);
    const uploaderId = getIdString(attachment.uploadedBy);

    if (
      ["projectAdmin", "projectManager"].includes(membership.role) ||
      uploaderId === userId
    ) {
      req.projectMembership = membership;
      req.projectRole = membership.role;
      return next();
    }

    return res.status(403).json({
      message: "You do not have permission to delete this attachment",
    });
  } catch (error) {
    console.error("requireAttachmentDeletePermission error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const attachWorkUnitToRequest = async (req, res, next) => {
  try {
    const workUnitId = req.params.id;
    if (!workUnitId) {
      return res.status(400).json({ message: "Work unit id is required" });
    }

    const workUnit = await WorkUnit.findById(workUnitId);
    if (!workUnit) {
      return res.status(404).json({ message: "WorkUnit not found" });
    }

    req.workUnit = workUnit;
    next();
  } catch (error) {
    console.error("attachWorkUnitToRequest error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requireWorkUnitManagePermission =
  (projectIdResolver) => async (req, res, next) => {
    try {
      if (isSystemAdmin(req)) return next();

      const projectId = projectIdResolver
        ? await projectIdResolver(req)
        : req.body.projectId || req.workUnit?.projectId;

      if (!projectId) {
        return res.status(400).json({ message: "Project id is required" });
      }

      const membership = await getProjectMembership(
        req.user?._id || req.user?.id,
        projectId,
      );

      if (!membership) {
        return res
          .status(403)
          .json({ message: "You are not a member of this project" });
      }

      if (!["projectAdmin", "projectManager"].includes(membership.role)) {
        return res.status(403).json({
          message: "You do not have permission to manage work units",
        });
      }

      req.projectMembership = membership;
      req.projectRole = membership.role;
      next();
    } catch (error) {
      console.error("requireWorkUnitManagePermission error:", error);
      res.status(500).json({ message: error.message });
    }
  };