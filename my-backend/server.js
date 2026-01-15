require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const USE_FAKE = process.env.USE_FAKE_DB === 'true' || !process.env.MONGO_URI;

let db;
if (USE_FAKE) {
  db = require(path.join(__dirname, 'db'));
  console.log('Using fake DB (file-backed)');
} else {
  // If user adds MONGO_URI later, they can expand here (mongoose models)
  console.log('MONGO_URI provided but mongoose models not configured; falling back to fake DB');
  db = require(path.join(__dirname, 'db'));
}

// Ensure seeded users have a default password if not set (for demo only)
(async () => {
  try {
    const users = db.getUsers();
    let changed = false;
    for (const u of users) {
      if (!u.passwordHash) {
        const h = await bcrypt.hash('password', 8);
        u.passwordHash = h;
        changed = true;
      }
    }
    if (changed) {
      // rewrite db.json fully by using addUser flow is not needed; save current structure
      const fs = require('fs');
      const dbPath = path.join(__dirname, 'db.json');
      const raw = fs.readFileSync(dbPath, 'utf8');
      const data = JSON.parse(raw);
      data.users = users;
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      console.log('Seeded user passwords set to default `password` (you can change in db.json)');
    }
  } catch (err) { /* ignore */ }
})();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function generateToken(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing auth token' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Invalid auth header' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Basic routes
app.get('/', (req, res) => res.send('Hello from my-backend (fake DB enabled)'));

// Auth
app.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const existing = db.findUserByEmail(email);
  if (existing) return res.status(400).json({ message: 'Email already registered' });
  const hash = await bcrypt.hash(password, 8);
  const user = db.addUser({ name: name || email.split('@')[0], email, passwordHash: hash, role: role || 'member' });
  const token = generateToken(user);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = db.findUserByEmail(email);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

// Projects
app.get('/projects', (req, res) => {
  const projects = db.getProjects();
  res.json(projects);
});

app.post('/projects', authMiddleware, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name required' });
  const project = db.addProject({ name, description: description || '', ownerId: req.user.id });
  res.json(project);
});

app.get('/projects/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = db.getProjectById(id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const tasks = db.getTasks().filter(t => t.projectId === id).map(t => ({
    ...t,
    // normalize status labels to match frontend columns
    status: (function(s) {
      if (!s) return 'TO DO';
      const v = String(s).toLowerCase();
      if (v === 'todo' || v === 'to do') return 'TO DO';
      if (v === 'inprogress' || v === 'in_progress' || v === 'in progress') return 'IN PROGRESS';
      if (v === 'inreview' || v === 'in_review' || v === 'in review') return 'IN REVIEW';
      if (v === 'done' || v === 'completed' || v === 'complete') return 'DONE';
      // fallback: uppercase words
      return String(s).toUpperCase();
    })(t.status)
  }));
  res.json({ ...project, tasks });
});

// Tasks
app.post('/projects/:id/tasks', authMiddleware, (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const { title, description, assigneeId } = req.body;
  if (!title) return res.status(400).json({ message: 'Task title required' });
  const task = db.addTask({ projectId, title, description: description || '', assigneeId: assigneeId || null, status: 'TO DO' });
  res.json(task);
});

app.patch('/tasks/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const patch = req.body;
  const updated = db.updateTask(id, patch);
  if (!updated) return res.status(404).json({ message: 'Task not found' });
  res.json(updated);
});

app.post('/tasks/:id/comments', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Comment text required' });
  const comment = db.addComment(id, { userId: req.user.id, text });
  if (!comment) return res.status(404).json({ message: 'Task not found' });
  res.json(comment);
});

app.post('/tasks/:id/logs', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { hours, notes } = req.body;
  if (typeof hours !== 'number') return res.status(400).json({ message: 'Hours number required' });
  const log = db.addLog(id, { userId: req.user.id, hours, notes: notes || '' });
  if (!log) return res.status(404).json({ message: 'Task not found' });
  res.json(log);
});

// Reports
app.get('/reports/progress', (req, res) => {
  const r = db.getProgressReport();
  res.json(r);
});

// Admin: list users
app.get('/users', authMiddleware, (req, res) => {
  const users = db.getUsers().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  res.json(users);
});

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
