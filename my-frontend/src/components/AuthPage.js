import React, { useState } from 'react';

export default function AuthPage({ onSuccess, api }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  async function doLogin(e) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.login({ email: form.email, password: form.password });
      if (res && res.token) onSuccess({ token: res.token, user: res.user });
      else alert(res.message || 'Login failed');
    } catch (err) { alert('Login error'); }
    setLoading(false);
  }

  async function doRegister(e) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.register({ name: form.name, email: form.email, password: form.password });
      if (res && res.token) onSuccess({ token: res.token, user: res.user });
      else alert(res.message || 'Register failed');
    } catch (err) { alert('Register error'); }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-header">
          <h2>{mode === 'login' ? 'Login' : 'Create account'}</h2>
          <div className="auth-toggle">
            <button className={mode==='login'?'active':''} onClick={() => setMode('login')}>Login</button>
            <button className={mode==='register'?'active':''} onClick={() => setMode('register')}>Register</button>
          </div>
        </div>

        {mode === 'login' ? (
          <form onSubmit={doLogin} className="auth-form">
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="submit" disabled={loading}>Sign in</button>
          </form>
        ) : (
          <form onSubmit={doRegister} className="auth-form">
            <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="submit" disabled={loading}>Create account</button>
          </form>
        )}

        <div className="auth-help">This frontend uses the backend if available; otherwise it falls back to a local demo dataset.</div>
      </div>
    </div>
  );
}
