require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

async function load() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('Please set MONGO_URI in .env to run seed script');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for seeding');

  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
  const projects = JSON.parse(fs.readFileSync(path.join(__dirname, 'projects.json'), 'utf8'));
  const tasks = JSON.parse(fs.readFileSync(path.join(__dirname, 'tasks.json'), 'utf8'));

  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});

  // insert users with hashed passwords
  const createdUsers = [];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password || 'password', 8);
    const cu = await User.create({ name: u.name, email: u.email, passwordHash: hash, role: u.role || 'member' });
    createdUsers.push(cu);
  }
  console.log('Users seeded:', createdUsers.length);

  // insert projects and link owner by email
  const createdProjects = [];
  for (const p of projects) {
    const owner = createdUsers.find(x => x.email === p.ownerEmail);
    const pr = await Project.create({ name: p.name, description: p.description || '', owner: owner ? owner._id : createdUsers[0]._id, members: owner ? [owner._id] : [createdUsers[0]._id] });
    createdProjects.push(pr);
  }
  console.log('Projects seeded:', createdProjects.length);

  // insert tasks linking to projects and assignees
  const createdTasks = [];
  for (const t of tasks) {
    const project = createdProjects.find(x => x.name === t.projectName);
    const assignee = createdUsers.find(x => x.email === t.assigneeEmail);
    const tk = await Task.create({ title: t.title, description: t.description || '', project: project ? project._id : createdProjects[0]._id, assignee: assignee ? assignee._id : null, status: t.status || 'TO DO' });
    createdTasks.push(tk);
  }
  console.log('Tasks seeded:', createdTasks.length);

  console.log('Seed complete');
  process.exit(0);
}

load().catch(err => { console.error(err); process.exit(1); });
