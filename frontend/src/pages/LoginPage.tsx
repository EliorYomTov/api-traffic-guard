import { useState } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'
import client from '../api/client'
import type { AuthResponse } from '../api/types'

interface Props { onLogin: (token: string) => void }

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    setError('')
    setLoading(true)
    try {
      const url  = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login' ? { username, password } : { username, email, password }
      const { data } = await client.post<AuthResponse>(url, body)
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)
      onLogin(data.token)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0b1220',
    border: '1px solid #1f2a44',
    borderRadius: 8,
    padding: '10px 14px',
    color: 'white',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 150ms',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    color: '#64748b',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.05em',
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
      <div style={{
        minHeight: '100vh',
        background: '#0b1220',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
      }}>

        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)',
        }} />

        <div style={{ width: 400, position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, background: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="white" />
            </div>
            <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>API Traffic Guard</span>
          </div>

          {/* Card */}
          <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 12, padding: 32 }}>

            {/* Mode toggle */}
            <div style={{ display: 'flex', background: '#0b1220', border: '1px solid #1f2a44', borderRadius: 8, padding: 3, marginBottom: 28 }}>
              {(['login', 'register'] as const).map(m => (
                  <button
                      key={m}
                      onClick={() => { setMode(m); setError('') }}
                      style={{
                        flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 13, fontWeight: 500,
                        background: mode === m ? '#1f2a44' : 'transparent',
                        color: mode === m ? 'white' : '#64748b',
                        transition: 'all 150ms',
                        border: 'none', cursor: 'pointer',
                      }}
                  >
                    {m === 'login' ? 'Sign in' : 'Sign up'}
                  </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Username */}
              <div>
                <label style={labelStyle}>USERNAME</label>
                <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="your-username"
                    autoComplete="username"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                    onBlur={e  => (e.target.style.borderColor = '#1f2a44')}
                />
              </div>

              {/* Email — register only */}
              {mode === 'register' && (
                  <div>
                    <label style={labelStyle}>EMAIL</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                        onBlur={e  => (e.target.style.borderColor = '#1f2a44')}
                    />
                  </div>
              )}

              {/* Password */}
              <div>
                <label style={labelStyle}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submit()}
                      placeholder="••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      style={{ ...inputStyle, paddingRight: 42 }}
                      onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                      onBlur={e  => (e.target.style.borderColor = '#1f2a44')}
                  />
                  <button
                      onClick={() => setShowPass(p => !p)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        color: '#64748b', padding: 0, background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex',
                      }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 6, padding: '8px 12px',
                    color: '#ef4444', fontSize: 13,
                  }}>
                    {error}
                  </div>
              )}

              {/* Submit */}
              <button
                  onClick={submit}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? '#1e3a5f' : '#3b82f6',
                    color: 'white',
                    padding: '11px 0',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms',
                    marginTop: 4,
                  }}
              >
                {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>

            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 20 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={switchMode} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', padding: 0 }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>

        </div>
      </div>
  )
}