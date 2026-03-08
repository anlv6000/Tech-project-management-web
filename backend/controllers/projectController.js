import Project from '../models/Project.js';
import UserProject from '../models/UserProject.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('createdBy', '-password');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', '-password');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const userProjects = await UserProject.find({ userId }).populate('projectId');
    const projectIds = userProjects.map(up => up.projectId._id);
    const projects = await Project.find({ _id: { $in: projectIds } }).populate('createdBy', '-password');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  const { name, description, methodology, startDate, endDate, createdBy } = req.body;
  
  try {
    const project = new Project({
      _id: new mongoose.Types.ObjectId(),
      name,
      description,
      methodology,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: new mongoose.Types.ObjectId(createdBy)
    });

    const savedProject = await project.save();
    
    // Add creator as Admin to the project
    const userProject = new UserProject({
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(createdBy),
      projectId: savedProject._id,
      role: 'Admin'
    });
    await userProject.save();

    const populatedProject = await Project.findById(savedProject._id).populate('createdBy', '-password');
    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description, methodology, startDate, endDate, isArchived } = req.body;
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        description, 
        methodology, 
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isArchived 
      },
      { new: true }
    ).populate('createdBy', '-password');
    
    if (!updatedProject) return res.status(404).json({ message: 'Project not found' });
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Delete related records
    await UserProject.deleteMany({ projectId: req.params.id });
    
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const inviteUserToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, fullName, role = 'Member' } = req.body;

    // Tìm user theo email hoặc fullName
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    } else if (fullName) {
      user = await User.findOne({ fullName });
    }

    // Tìm project để lấy tên
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Nếu user tồn tại trong hệ thống, gửi notification mời
    if (user) {
      // Kiểm tra đã mời chưa
      const existingInvitation = await Notification.findOne({
        userId: user._id,
        type: 'invitation',
        'data.projectId': projectId,
        'data.status': { $in: ['pending', 'accepted'] }
      });

      if (existingInvitation) {
        return res.status(400).json({ message: 'User already invited or in project' });
      }

      // Tạo token mời
      const invitationToken = jwt.sign(
        { email: user.email, projectId, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Tạo notification mời
      const notification = new Notification({
        _id: new mongoose.Types.ObjectId(),
        userId: user._id,
        type: 'invitation',
        title: `Project Invitation: ${project.name}`,
        message: `You have been invited to join the project "${project.name}" as ${role}`,
        data: {
          projectId,
          projectName: project.name,
          role,
          status: 'pending',
          invitationToken
        }
      });

      await notification.save();
      return res.json({ success: true, message: 'Invitation sent to existing user', user });
    }

    // Nếu user chưa tồn tại, tạo token mời và log link
    if (!user && email) {
      // Tạo token mời
      const invitationToken = jwt.sign(
        { email, projectId, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation?token=${invitationToken}`;

      console.log('Invitation link (send via email):', invitationLink);
      console.log('Token details:', { email, projectId, role });

      return res.json({
        success: true,
        message: 'Invitation link generated for new user',
        invitationLink
      });
    }

    return res.status(400).json({ message: 'Email or full name is required' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, projectId, role } = decoded;

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Kiểm tra đã trong project chưa
    const existingUserProject = await UserProject.findOne({ userId: user._id, projectId });
    if (existingUserProject) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }

    // Thêm user vào project
    const userProject = new UserProject({
      _id: new mongoose.Types.ObjectId(),
      userId: user._id,
      projectId: new mongoose.Types.ObjectId(projectId),
      role
    });

    await userProject.save();

    // Cập nhật notification thành accepted nếu có
    await Notification.findOneAndUpdate(
      {
        userId: user._id,
        type: 'invitation',
        'data.projectId': projectId
      },
      {
        'data.status': 'accepted',
        isRead: true
      }
    );

    // Tạo notification chào mừng
    const project = await Project.findById(projectId);
    const welcomeNotification = new Notification({
      _id: new mongoose.Types.ObjectId(),
      userId: user._id,
      type: 'project',
      title: `Welcome to ${project?.name || 'the project'}!`,
      message: `You have successfully joined the project as ${role}`,
      data: { projectId }
    });

    await welcomeNotification.save();

    res.json({ success: true, message: 'Successfully joined the project', projectId });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid invitation token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Invitation token has expired' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const completeProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.isCompleted = true;
    await project.save();

    res.json({ message: 'Project marked as complete', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
