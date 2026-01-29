const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// create task under project
router.post('/projects/:id/tasks', auth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description, assigneeId } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title required' });
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const task = await Task.create({ title, description: description || '', project: project._id, assignee: assigneeId || null });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// patch task
router.patch('/tasks/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const patch = req.body;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    // allow limited fields
    ['title','description','assignee','status'].forEach(f => { if (patch[f] !== undefined) task[f] = patch[f]; });
    await task.save();
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// add comment
router.post('/tasks/:id/comments', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.comments.push({ user: req.user._id, text });
    await task.save();
    res.json(task.comments[task.comments.length-1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// add log
router.post('/tasks/:id/logs', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { hours, notes } = req.body;
    if (typeof hours !== 'number' && typeof hours !== 'string') return res.status(400).json({ message: 'Hours number required' });
    const hrs = Number(hours);
    if (Number.isNaN(hrs)) return res.status(400).json({ message: 'Hours must be numeric' });
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.logs.push({ user: req.user._id, hours: hrs, notes: notes || '' });
    await task.save();
    res.json(task.logs[task.logs.length-1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
