import UserProject from "../models/UserProject.js";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import Attachment from "../models/Attachment.js";
import { createAuditLogFromRequest } from "../utils/auditLogger.js";
import { normalizeProjectRole } from "../middleware/projectPermissions.js";

const VALID_ROLES = ["projectAdmin", "projectManager", "member", "viewer"];

const EDITABLE_ROLES_BY_PROJECT_ADMIN = ["projectManager", "member", "viewer"];

export const getAllUserProjects = async (req, res) => {
  try {
    const userProjects = await UserProject.find();
    res.json(
      userProjects.map((item) => ({
        ...item.toObject(),
        role: normalizeProjectRole(item.role),
      })),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const members = await UserProject.find({ projectId })
      .populate("userId", "-password")
      .lean();

    res.json(
      members.map((member) => ({
        ...member,
        role: normalizeProjectRole(member.role),
      })),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addUserToProject = async (req, res) => {
  try {
    const { userId, projectId, role } = req.body;

    if (!userId || !projectId) {
      return res
        .status(400)
        .json({ message: "userId and projectId are required" });
    }

    const normalizedRole = normalizeProjectRole(role);

    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid project role" });
    }

    const existingUserProject = await UserProject.findOne({
      userId,
      projectId,
    });

    if (existingUserProject) {
      return res.status(400).json({ message: "User already added to project" });
    }

    const userProject = new UserProject({
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(userId),
      projectId: new mongoose.Types.ObjectId(projectId),
      role: normalizedRole,
    });

    const saved = await userProject.save();

    const populated = await UserProject.findById(saved._id).populate(
      "userId",
      "-password",
    );

    await createAuditLogFromRequest(req, {
      action: "create",
      entity: "userproject",
      entityId: saved._id,
      details: `${req.user?.fullName || "User"} added user ${userId} to project ${projectId} as ${normalizedRole}`,
    });

    res.status(201).json({
      ...populated.toObject(),
      role: normalizeProjectRole(populated.role),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeUserFromProject = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    const targetMembership = await UserProject.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    if (!targetMembership) {
      return res.status(404).json({ message: "User not found in project" });
    }

    const normalizedRole = normalizeProjectRole(targetMembership.role);

    if (normalizedRole === "projectAdmin") {
      const adminCount = await UserProject.countDocuments({
        projectId: new mongoose.Types.ObjectId(projectId),
        role: "projectAdmin",
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot remove the last project admin",
        });
      }
    }

    await UserProject.findByIdAndDelete(targetMembership._id);

    await createAuditLogFromRequest(req, {
      action: "delete",
      entity: "userproject",
      entityId: targetMembership._id,
      details: `${req.user?.fullName || "User"} removed user ${userId} from project ${projectId}`,
    });

    res.json({ message: "User removed from project" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const { role } = req.body;

    const normalizedRole = normalizeProjectRole(role);

    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid project role" });
    }

    if (!EDITABLE_ROLES_BY_PROJECT_ADMIN.includes(normalizedRole)) {
      return res.status(400).json({
        message:
          "Project admin can only assign Project Manager, Member, or Viewer",
      });
    }

    const requesterId = String(req.user?._id || req.user?.id || "");
    if (String(userId) === requesterId) {
      return res.status(400).json({
        message: "You cannot change your own project role",
      });
    }

    const userProject = await UserProject.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    if (!userProject) {
      return res.status(404).json({ message: "User not found in project" });
    }

    const oldRole = normalizeProjectRole(userProject.role);

    if (oldRole === "projectAdmin") {
      return res.status(400).json({
        message: "Cannot change the role of a project admin from this screen",
      });
    }

    userProject.role = normalizedRole;
    await userProject.save();

    const populated = await UserProject.findById(userProject._id).populate(
      "userId",
      "-password",
    );

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "userproject",
      entityId: userProject._id,
      details: `${req.user?.fullName || "User"} changed role of user ${userId} in project ${projectId} from ${oldRole} to ${normalizedRole}`,
    });

    return res.json({
      ...populated.toObject(),
      role: normalizeProjectRole(populated.role),
    });
  } catch (error) {
    console.error("updateUserRole error:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getUserProjectsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const userProjects = await UserProject.find({ userId }).populate({
      path: "projectId",
      populate: [
        { path: "tasks" },
        { path: "comments" },
        { path: "attachments" },
      ],
    });

    res.json(
      userProjects.map((item) => ({
        ...item.toObject(),
        role: normalizeProjectRole(item.role),
      })),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.params;

    const userProjects = await UserProject.find({ userId }).populate(
      "projectId",
    );
    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assigneeId: userId }],
    });
    const comments = await Comment.find({ userId });
    const attachments = await Attachment.find({ uploadedBy: userId });

    res.json({
      userProjects: userProjects.map((item) => ({
        ...item.toObject(),
        role: normalizeProjectRole(item.role),
      })),
      tasks,
      comments,
      attachments,
    });
  } catch (error) {
    console.error("Error in getUserData:", error);
    res.status(500).json({ message: error.message });
  }
};