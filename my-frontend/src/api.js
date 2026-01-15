const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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
export async function getProjects(token) { return request('/projects', { method: 'GET', token }); }
export async function createProject(payload, token) { return request('/projects', { method: 'POST', body: JSON.stringify(payload), token }); }
export async function getProject(id) { return request(`/projects/${id}`, { method: 'GET' }); }
export async function createTask(projectId, payload, token) { return request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(payload), token }); }
