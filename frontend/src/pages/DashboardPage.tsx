import { useEffect, useState } from 'react';
import type { ApiKey } from '../api/types';
import client from '../api/client';

interface Props { onLogout: () => void; }

export default function DashboardPage({ onLogout }: Props) {
    const username = localStorage.getItem('username') || 'User';
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyPlaintext, setNewKeyPlaintext] = useState('');
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get<ApiKey[]>('/api/v1/api-keys')
            .then(res => setApiKeys(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const createKey = async () => {
        if (!newKeyName.trim()) return;
        setCreating(true);
        try {
            const { data } = await client.post<ApiKey>('/api/v1/api-keys', { name: newKeyName });
            setNewKeyPlaintext(data.plaintext || '');
            setNewKeyName('');
            const { data: keys } = await client.get<ApiKey[]>('/api/v1/api-keys');
            setApiKeys(keys);
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    const revokeKey = async (id: number) => {
        await client.delete(`/api/v1/api-keys/${id}`);
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, active: false } : k));
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleString();

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
            Loading...
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* Sidebar */}
            <aside style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>API Traffic Guard</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{username}</div>
                </div>
                <nav style={{ flex: 1, padding: '16px 0' }}>
                    {['Overview', 'API Keys', 'Events'].map(item => (
                        <div key={item} style={{ padding: '8px 20px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                             onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                             onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            {item}
                        </div>
                    ))}
                </nav>
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                    <button onClick={onLogout} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px 0', width: '100%', textAlign: 'left' }}>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
                <div style={{ maxWidth: 900 }}>

                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Overview</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Manage your API keys and monitor traffic</p>
                    </div>

                    {/* Plan card */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>PLAN</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 18 }}>FREE</span>
                                <span style={{ background: '#6366f1', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>FREE</span>
                            </div>
                        </div>
                        <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>RATE LIMIT</div>
                            <div style={{ fontWeight: 600, fontSize: 18 }}>60 <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>req/min</span></div>
                        </div>
                        <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ACTIVE KEYS</div>
                            <div style={{ fontWeight: 600, fontSize: 18 }}>{apiKeys.filter(k => k.active).length}</div>
                        </div>
                    </div>

                    {/* New key plaintext banner */}
                    {newKeyPlaintext && (
                        <div style={{ background: '#0d2d1a', border: '1px solid #22c55e', borderRadius: 10, padding: 16, marginBottom: 24 }}>
                            <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 8, fontWeight: 600 }}>
                                ✓ API KEY CREATED — Copy it now, you won't see it again
                            </div>
                            <code style={{ fontFamily: 'monospace', fontSize: 13, color: '#86efac', wordBreak: 'break-all' }}>
                                {newKeyPlaintext}
                            </code>
                            <button onClick={() => { navigator.clipboard.writeText(newKeyPlaintext); setNewKeyPlaintext(''); }}
                                    style={{ marginTop: 10, background: '#22c55e', color: 'white', fontSize: 12, padding: '5px 12px', display: 'block' }}>
                                Copy & Dismiss
                            </button>
                        </div>
                    )}

                    {/* API Keys */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 24 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 600 }}>API Keys</div>
                        </div>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                                   onKeyDown={e => e.key === 'Enter' && createKey()}
                                   placeholder="Key name (e.g. Production server)" style={{ flex: 1 }} />
                            <button onClick={createKey} disabled={creating}
                                    style={{ background: 'var(--primary)', color: 'white', whiteSpace: 'nowrap' }}>
                                {creating ? 'Creating...' : '+ Create Key'}
                            </button>
                        </div>
                        {apiKeys.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No API keys yet</div>
                        ) : apiKeys.map(key => (
                            <div key={key.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{key.name}</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{key.prefix}...</div>
                                    {key.lastUsedAt && (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Last used: {formatDate(key.lastUsedAt)}</div>
                                    )}
                                </div>
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: key.active ? '#0d2d1a' : '#2a1a1a', color: key.active ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {key.active ? 'ACTIVE' : 'REVOKED'}
                </span>
                                {key.active && (
                                    <button onClick={() => revokeKey(key.id)}
                                            style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', fontSize: 12, padding: '4px 10px' }}>
                                        Revoke
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Security Events */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 600 }}>Security Events</div>
                        </div>
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No events to display
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}