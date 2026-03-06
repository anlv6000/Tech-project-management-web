import WorkUnit from '../models/WorkUnit.js';
import mongoose from 'mongoose';

export const getProjectWorkUnits = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId || projectId === 'undefined') {
      return res.json([]);
    }
    const workUnits = await WorkUnit.find({ projectId }).sort('order');
    res.json(workUnits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkUnitById = async (req, res) => {
  try {
    const workUnit = await WorkUnit.findById(req.params.id);
    if (!workUnit) return res.status(404).json({ message: 'WorkUnit not found' });
    res.json(workUnit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWorkUnit = async (req, res) => {
  try {
    const { projectId, name, type, order, startDate, endDate, goal } = req.body;
    
    const workUnit = new WorkUnit({
      _id: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(projectId),
      name,
      type,
      order: order || 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      goal: goal || null
    });

    const saved = await workUnit.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateWorkUnit = async (req, res) => {
  try {
    const { name, type, order, startDate, endDate, goal } = req.body;
    
    const updated = await WorkUnit.findByIdAndUpdate(
      req.params.id,
      {
        name,
        type,
        order,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        goal
      },
      { new: true }
    );
    
    if (!updated) return res.status(404).json({ message: 'WorkUnit not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteWorkUnit = async (req, res) => {
  try {
    const workUnit = await WorkUnit.findByIdAndDelete(req.params.id);
    if (!workUnit) return res.status(404).json({ message: 'WorkUnit not found' });
    res.json({ message: 'WorkUnit deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
