import UserProject from '../models/UserProject.js';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import Attachment from '../models/Attachment.js';

export const getAllUserProjects = async (req, res) => {
  try {
    const userProjects = await UserProject.find();
    res.json(userProjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const members = await UserProject.find({ projectId }).populate('userId', '-password').lean();
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addUserToProject = async (req, res) => {
  try {
    const { userId, projectId, role } = req.body;

    const existingUserProject = await UserProject.findOne({ userId, projectId });
    if (existingUserProject) {
      return res.status(400).json({ message: 'User already added to project' });
    }

    const userProject = new UserProject({
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(userId),
      projectId: new mongoose.Types.ObjectId(projectId),
      role: role || 'Member'
    });

    const saved = await userProject.save();
    const populated = await UserProject.findById(saved._id).populate('userId', '-password');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeUserFromProject = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    const userProject = await UserProject.findOneAndDelete({
      userId: new mongoose.Types.ObjectId(userId),
      projectId: new mongoose.Types.ObjectId(projectId)
    });

    if (!userProject) return res.status(404).json({ message: 'User not found in project' });
    res.json({ message: 'User removed from project' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const { role } = req.body;

    const userProject = await UserProject.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), projectId: new mongoose.Types.ObjectId(projectId) },
      { role },
      { new: true }
    ).populate('userId', '-password');

    if (!userProject) return res.status(404).json({ message: 'User not found in project' });
    res.json(userProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserProjectsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const userProjects = await UserProject.find({ userId })
      .populate({
        path: 'projectId',
        populate: [
          { path: 'tasks' },
          { path: 'comments' },
          { path: 'attachments' }
        ]
      });

    res.json(userProjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("👉 getUserData called with userId:", userId);

    // Query từng bảng và log kết quả
    const userProjects = await UserProject.find({ userId }).populate('projectId');
    console.log("👉 userProjects:", userProjects);

    const tasks = await Task.find({ $or: [{ createdBy: userId }, { assigneeId: userId }] });
    console.log("👉 tasks:", tasks);

    const comments = await Comment.find({ userId });
    console.log("👉 comments:", comments);

    const attachments = await Attachment.find({ uploadedBy: userId });
    console.log("👉 attachments:", attachments);

    res.json({ userProjects, tasks, comments, attachments });
  } catch (error) {
    console.error("❌ Error in getUserData:", error);
    res.status(500).json({ message: error.message });
  }
};




