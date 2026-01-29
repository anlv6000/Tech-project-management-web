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
    <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:360,padding:20,border:'1px solid #ddd',borderRadius:6,boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}>
        <h2 style={{marginTop:0}}>{mode==='login'?'Sign in':'Create account'}</h2>
        {mode==='login' ? (
          <form onSubmit={doLogin}>
            <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={{width:'100%',padding:8,marginBottom:8}} />
            <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={{width:'100%',padding:8,marginBottom:8}} />
            <button type="submit" disabled={loading} style={{width:'100%',padding:10}}>Sign in</button>
          </form>
        ) : (
          <form onSubmit={doRegister}>
            <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={{width:'100%',padding:8,marginBottom:8}} />
            <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={{width:'100%',padding:8,marginBottom:8}} />
            <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={{width:'100%',padding:8,marginBottom:8}} />
            <button type="submit" disabled={loading} style={{width:'100%',padding:10}}>Create account</button>
          </form>
        )}

        <div style={{marginTop:12,textAlign:'center'}}>
          <button onClick={()=>setMode(mode==='login'?'register':'login')} style={{border:'none',background:'none',color:'#06f',cursor:'pointer'}}>{mode==='login'?'Create account':'Back to login'}</button>
        </div>
      </div>
    </div>
  );
}
