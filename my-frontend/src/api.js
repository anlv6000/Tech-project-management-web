const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

async function request(path, options = {}) {
  const url = API_BASE + path;
  const headers = options.headers || {};
  if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function register(payload) { return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }); }
export async function login(payload) { return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }); }
export async function getProjects(token) {
  const res = await request('/projects', { method: 'GET', token });
  if (!Array.isArray(res)) return res;
  return res.map(p => ({ ...p, id: p._id || p.id }));
}
export async function createProject(payload, token) { return request('/projects', { method: 'POST', body: JSON.stringify(payload), token }); }
export async function getProject(id) {
  const res = await request(`/projects/${id}`, { method: 'GET' });
  if (!res) return res;
  const normalized = { ...res, id: res._id || res.id };
  if (Array.isArray(res.tasks)) normalized.tasks = res.tasks.map(t => ({ ...t, id: t._id || t.id, assigneeId: t.assignee?._id || t.assigneeId || t.assignee }));
  if (Array.isArray(res.members)) normalized.members = res.members.map(m => ({ ...m, id: m._id || m.id }));
  return normalized;
}
export async function createTask(projectId, payload, token) { return request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(payload), token }); }
export async function patchTask(id, payload, token) { return request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload), token }); }
export async function addComment(taskId, payload, token) { return request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify(payload), token }); }
export async function addLog(taskId, payload, token) { return request(`/tasks/${taskId}/logs`, { method: 'POST', body: JSON.stringify(payload), token }); }
export async function getUsers(token) { const res = await request('/users', { method: 'GET', token }); if (!Array.isArray(res)) return res; return res.map(u=>({ ...u, id: u._id || u.id })); }
export async function addProjectMember(projectId, payload, token) { return request(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(payload), token }); }
export async function removeProjectMember(projectId, userId, token) { return request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE', token }); }
export async function updateUser(userId, payload, token) { return request(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload), token }); }

export default { register, login, getProjects, createProject, getProject, createTask, patchTask, addComment, addLog, getUsers, addProjectMember, removeProjectMember, updateUser };
