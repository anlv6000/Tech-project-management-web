import Project from "../models/Project.js";
import UserProject from "../models/UserProject.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createAuditLogFromRequest } from "../utils/auditLogger.js";
import nodemailer from "nodemailer";
import { normalizeProjectRole } from "../middleware/projectPermissions.js";
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("createdBy", "-password");
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "createdBy",
      "-password",
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const userProjects = await UserProject.find({ userId }).populate(
      "projectId",
    );
    const projectIds = userProjects.map((up) => up.projectId._id);
    const projects = await Project.find({ _id: { $in: projectIds } }).populate(
      "createdBy",
      "-password",
    );
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  const { name, description, methodology, startDate, endDate } = req.body;

  try {
    const project = new Project({
      _id: new mongoose.Types.ObjectId(),
      name,
      description,
      methodology,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    const savedProject = await project.save();

    const userProject = new UserProject({
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(req.user._id),
      projectId: savedProject._id,
      role: "projectAdmin",
    });

    await userProject.save();

    const populatedProject = await Project.findById(savedProject._id).populate(
      "createdBy",
      "-password",
    );

    await createAuditLogFromRequest(req, {
      action: "create",
      entity: "project",
      entityId: populatedProject._id,
      details: `${req.user?.fullName || "User"} created project ${populatedProject.name}`,
    });

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description, methodology, startDate, endDate, isArchived } =
      req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        methodology,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isArchived,
      },
      { new: true },
    ).populate("createdBy", "-password");

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "project",
      entityId: updatedProject._id,
      details: `${req.user?.fullName || "User"} updated project ${updatedProject.name}`,
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await UserProject.deleteMany({ projectId: req.params.id });

    await createAuditLogFromRequest(req, {
      action: "delete",
      entity: "project",
      entityId: project._id,
      details: `${req.user?.fullName || "User"} deleted project ${project.name}`,
    });

    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const inviteUserToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, fullName, role = "member" } = req.body;

    const normalizedRole = normalizeProjectRole(role);

    let user = null;
    if (email) {
      user = await User.findOne({ email });
    } else if (fullName) {
      user = await User.findOne({ fullName });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (user) {
      const existingMember = await UserProject.findOne({
        userId: user._id,
        projectId,
      });

      if (existingMember) {
        return res
          .status(400)
          .json({ message: "User is already in this project" });
      }

      const existingInvitation = await Notification.findOne({
        userId: user._id,
        type: "invitation",
        "data.projectId": projectId,
        "data.status": { $in: ["pending", "accepted"] },
      });

      if (existingInvitation) {
        return res
          .status(400)
          .json({ message: "User already invited or in project" });
      }

      const invitationToken = jwt.sign(
        { email: user.email, projectId, role: normalizedRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      const notification = new Notification({
        _id: new mongoose.Types.ObjectId(),
        userId: user._id,
        type: "invitation",
        title: `Project Invitation: ${project.name}`,
        message: `You have been invited to join the project "${project.name}" as ${normalizedRole}`,
        data: {
          projectId,
          projectName: project.name,
          role: normalizedRole,
          status: "pending",
          invitationToken,
        },
      });

      await notification.save();

      return res.json({
        success: true,
        message: "Invitation sent to existing user",
        user,
      });
    }

    if (!user && email) {
      const invitationToken = jwt.sign(
        { email, projectId, role: normalizedRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      const invitationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invitation?token=${invitationToken}`;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: `Invitation to join project ${project.name}`,
        text: `You have been invited to join the project "${project.name}" as ${normalizedRole}.
Click the link below to accept:
${invitationLink}

This link will expire in 7 days.`,
      });

      return res.json({
        success: true,
        message: "Invitation email sent to new user",
        invitationLink,
      });
    }

    return res.status(400).json({ message: "Email or full name is required" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, projectId, role } = decoded;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please register first." });
    }

    const existingUserProject = await UserProject.findOne({
      userId: user._id,
      projectId,
    });

    if (existingUserProject) {
      return res
        .status(400)
        .json({ message: "You are already a member of this project" });
    }

    const finalRole = normalizeProjectRole(role);

    const userProject = new UserProject({
      _id: new mongoose.Types.ObjectId(),
      userId: user._id,
      projectId: new mongoose.Types.ObjectId(projectId),
      role: finalRole,
    });

    await userProject.save();

    await Notification.findOneAndUpdate(
      { userId: user._id, type: "invitation", "data.projectId": projectId },
      { "data.status": "accepted", isRead: true },
    );

    const project = await Project.findById(projectId);
    const welcomeNotification = new Notification({
      _id: new mongoose.Types.ObjectId(),
      userId: user._id,
      type: "project",
      title: `Welcome to ${project?.name || "the project"}!`,
      message: `You have successfully joined the project as ${finalRole}`,
      data: { projectId },
    });

    await welcomeNotification.save();

    res.json({
      success: true,
      message: "Successfully joined the project",
      projectId,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid invitation token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Invitation token has expired" });
    }
    console.error("acceptInvitation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const completeProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.isCompleted = true;
    await project.save();

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "project",
      entityId: project._id,
      details: `${req.user?.fullName || "User"} marked project ${project.name} as complete`,
    });

    res.json({ message: "Project marked as complete", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
