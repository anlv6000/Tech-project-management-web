import Task from '../models/Task.js';
import mongoose from 'mongoose';

export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId || projectId === 'undefined') {
      return res.json([]);
    }
    const tasks = await Task.find({ projectId })
      .populate('assigneeId', '-password')
      .populate('createdBy', '-password')
      .sort('-createdAt');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasksByWorkUnit = async (req, res) => {
  try {
    const { workUnitId } = req.params;
    const tasks = await Task.find({ workUnitId })
      .populate('assigneeId', '-password')
      .populate('createdBy', '-password')
      .sort('order');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigneeId', '-password')
      .populate('createdBy', '-password');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { projectId, workUnitId, title, description, assigneeId, status, deadline, createdBy, order, timeSpent } = req.body;
    
    const task = new Task({
      _id: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(projectId),
      workUnitId: new mongoose.Types.ObjectId(workUnitId),
      title,
      description,
      assigneeId: assigneeId ? new mongoose.Types.ObjectId(assigneeId) : null,
      status: status || 'todo',
      deadline: deadline ? new Date(deadline) : null,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      order: order || 0,
      timeSpent: timeSpent || 0
    });

    const saved = await task.save();
    const populated = await Task.findById(saved._id)
      .populate('assigneeId', '-password')
      .populate('createdBy', '-password');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, assigneeId, status, deadline, order, timeSpent } = req.body;
    
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        assigneeId: assigneeId ? new mongoose.Types.ObjectId(assigneeId) : null,
        status,
        deadline: deadline ? new Date(deadline) : undefined,
        order,
        timeSpent
      },
      { new: true }
    ).populate('assigneeId', '-password')
     .populate('createdBy', '-password');
    
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
