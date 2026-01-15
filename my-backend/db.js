const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: [], projects: [], tasks: [], nextIds: { user: 1, project: 1, task: 1 } };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getNext(type) {
  const data = load();
  const key = type;
  const id = data.nextIds[key] || 1;
  data.nextIds[key] = id + 1;
  save(data);
  return id;
}

module.exports = {
  getUsers() { return load().users; },
  getUserById(id) { return load().users.find(u => u.id === id); },
  findUserByEmail(email) { return load().users.find(u => u.email === email); },
  addUser(user) {
    const data = load();
    user.id = getNext('user');
    data.users.push(user);
    save(data);
    return user;
  },
  getProjects() { return load().projects; },
  getProjectById(id) { return load().projects.find(p => p.id === id); },
  addProject(project) {
    const data = load();
    project.id = getNext('project');
    project.createdAt = new Date().toISOString();
    data.projects.push(project);
    save(data);
    return project;
  },
  getTasks() { return load().tasks; },
  addTask(task) {
    const data = load();
    task.id = getNext('task');
    task.comments = [];
    task.logs = [];
    task.createdAt = new Date().toISOString();
    data.tasks.push(task);
    save(data);
    return task;
  },
  getTaskById(id) { return load().tasks.find(t => t.id === id); },
  updateTask(id, patch) {
    const data = load();
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    data.tasks[idx] = { ...data.tasks[idx], ...patch };
    save(data);
    return data.tasks[idx];
  },
  addComment(taskId, comment) {
    const data = load();
    const t = data.tasks.find(t => t.id === taskId);
    if (!t) return null;
    comment.id = (t.comments.length ? t.comments[t.comments.length - 1].id + 1 : 1);
    comment.createdAt = new Date().toISOString();
    t.comments.push(comment);
    save(data);
    return comment;
  },
  addLog(taskId, log) {
    const data = load();
    const t = data.tasks.find(t => t.id === taskId);
    if (!t) return null;
    log.id = (t.logs.length ? t.logs[t.logs.length - 1].id + 1 : 1);
    log.createdAt = new Date().toISOString();
    t.logs.push(log);
    save(data);
    return log;
  },
  getProgressReport() {
    const data = load();
    // Simple report: projects with counts
    return data.projects.map(p => {
      const tasks = data.tasks.filter(t => t.projectId === p.id);
      const done = tasks.filter(t => (t.status || '').toString().toLowerCase() === 'done').length;
      const total = tasks.length;
      return { projectId: p.id, projectName: p.name, totalTasks: total, doneTasks: done };
    });
  }
};
