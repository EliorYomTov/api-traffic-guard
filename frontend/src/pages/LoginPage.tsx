import { useState } from 'react';
import client from '../api/client';
import type { AuthResponse } from '../api/types';

interface Props { onLogin: (token: string) => void; }

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { username, password } : { username, email, password };
      const { data } = await client.post<AuthResponse>(url, body);
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      onLogin(data.token);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>API Traffic Guard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-muted)', fontSize: 12 }}>USERNAME</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="your-username" />
          </div>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-muted)', fontSize: 12 }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-muted)', fontSize: 12 }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} placeholder="••••••••" />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

          <button onClick={submit} disabled={loading}
            style={{ background: 'var(--primary)', color: 'white', padding: '10px 16px', marginTop: 4 }}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}