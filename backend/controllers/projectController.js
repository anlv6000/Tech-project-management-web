import Project from '../models/Project.js';
import UserProject from '../models/UserProject.js';
import mongoose from 'mongoose';

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
