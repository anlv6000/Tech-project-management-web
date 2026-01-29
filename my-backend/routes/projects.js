const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// list projects
router.get('/', async (req, res) => {
  const projects = await Project.find().populate('owner', 'name email role').lean();
  res.json(projects);
});

// create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });
    const project = await Project.create({ name, description: description || '', owner: req.user._id, members: [req.user._id] });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// get project by id including tasks
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const project = await Project.findById(id).populate('owner', 'name email role').populate('members', 'name email role').lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const tasks = await Task.find({ project: id }).populate('assignee', 'name email').lean();
    // normalize statuses
    const mapStatus = s => {
      if (!s) return 'TO DO';
      const v = String(s).toLowerCase();
      if (v.includes('todo')) return 'TO DO';
      if (v.includes('in progress') || v.includes('inprogress') || v.includes('in_progress')) return 'IN PROGRESS';
      if (v.includes('in review') || v.includes('inreview') || v.includes('in_review')) return 'IN REVIEW';
      if (v.includes('done') || v.includes('completed')) return 'DONE';
      return String(s).toUpperCase();
    };
    const tasksNormalized = tasks.map(t => ({ ...t, status: mapStatus(t.status) }));
    res.json({ ...project, tasks: tasksNormalized });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// add member to project by user id or email
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { userId, email } = req.body;
    const id = req.params.id;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    // only owner or admin can add
    if (!(req.user.role === 'admin' || String(project.owner) === String(req.user._id))) return res.status(403).json({ message: 'Not allowed' });
    const User = require('../models/User');
    let user;
    if (userId) user = await User.findById(userId);
    else if (email) user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (project.members.map(m => String(m)).includes(String(user._id))) return res.status(400).json({ message: 'User already a member' });
    project.members.push(user._id);
    await project.save();
    const populated = await Project.findById(id).populate('members', 'name email role').lean();
    res.json(populated.members);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// remove member
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const id = req.params.id;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!(req.user.role === 'admin' || String(project.owner) === String(req.user._id))) return res.status(403).json({ message: 'Not allowed' });
    project.members = project.members.filter(m => String(m) !== String(userId));
    await project.save();
    const populated = await Project.findById(id).populate('members', 'name email role').lean();
    res.json(populated.members);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
