import {
    Shield, LayoutDashboard, Key, ShieldAlert, LineChart,
    Ban, SlidersHorizontal, CreditCard, Settings, ChevronRight
} from 'lucide-react'

export type Page = 'overview' | 'api-keys' | 'security-events' | 'analytics' | 'blocked-ips' | 'rate-limits' | 'billing' | 'settings'

interface Props {
    activePage:  Page
    onNavigate:  (page: Page) => void
    onLogout:    () => void
    username:    string
    plan:        string
    compact?:    boolean   // medium screen — narrower, labels hidden
}

const navItems: { icon: React.ElementType; label: string; page: Page; badge?: string; badgeDanger?: boolean }[] = [
    { icon: LayoutDashboard,   label: 'Overview',        page: 'overview' },
    { icon: Key,               label: 'API Keys',        page: 'api-keys',        badge: '3' },
    { icon: ShieldAlert,       label: 'Security Events', page: 'security-events', badge: '12', badgeDanger: true },
    { icon: LineChart,         label: 'Analytics',       page: 'analytics' },
    { icon: Ban,               label: 'Blocked IPs',     page: 'blocked-ips' },
    { icon: SlidersHorizontal, label: 'Rate Limits',     page: 'rate-limits' },
]

const bottomItems: { icon: React.ElementType; label: string; page: Page }[] = [
    { icon: CreditCard, label: 'Billing',  page: 'billing'  },
    { icon: Settings,   label: 'Settings', page: 'settings' },
]

export default function Sidebar({ activePage, onNavigate, onLogout, username, plan, compact = false }: Props) {
    const initials = username.slice(0, 1).toUpperCase()

    const itemStyle = (active: boolean): React.CSSProperties => ({
        padding:     compact ? '10px 0' : '8px 12px',
        marginBottom: 2,
        borderRadius: 6,
        display:     'flex',
        alignItems:  'center',
        justifyContent: compact ? 'center' : 'flex-start',
        gap:         compact ? 0 : 10,
        cursor:      'pointer',
        fontSize:    13,
        background:  active ? 'rgba(59,130,246,0.15)' : 'transparent',
        borderLeft:  active ? '2px solid #3b82f6'     : '2px solid transparent',
        color:       active ? '#60a5fa'                : '#94a3b8',
        transition:  'background 0.15s, color 0.15s',
        userSelect:  'none',
        position:    'relative',
    })

    const hoverOn  = (e: React.MouseEvent<HTMLDivElement>, active: boolean) => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
    }
    const hoverOff = (e: React.MouseEvent<HTMLDivElement>, active: boolean) => {
        if (!active) e.currentTarget.style.background = 'transparent'
    }

    return (
        <aside style={{
            background:    '#111a2e',
            border:        '1px solid #1f2a44',
            borderRadius:  12,
            display:       'flex',
            flexDirection: 'column',
            position:      'sticky',
            top:           20,
            height:        'fit-content',
            width:         compact ? 56 : undefined,
            overflow:      'hidden',
        }}>

            {/* Logo */}
            <div style={{
                padding:      compact ? '16px 0' : '20px 20px',
                borderBottom: '1px solid #1f2a44',
                display:      'flex',
                alignItems:   'center',
                justifyContent: compact ? 'center' : 'flex-start',
                gap:          8,
            }}>
                <div style={{ width: 28, height: 28, background: '#3b82f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={16} color="white" />
                </div>
                {!compact && <span style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>Traffic Guard</span>}
            </div>

            {/* Nav */}
            <div style={{ padding: compact ? '12px 4px' : 12, flex: 1 }}>
                {navItems.map(({ icon: Icon, label, page, badge, badgeDanger }) => {
                    const active = activePage === page
                    return (
                        <div
                            key={page}
                            onClick={() => onNavigate(page)}
                            title={compact ? label : undefined}
                            style={itemStyle(active)}
                            onMouseEnter={e => hoverOn(e, active)}
                            onMouseLeave={e => hoverOff(e, active)}
                        >
                            <Icon size={16} />
                            {!compact && label}
                            {!compact && badge && (
                                <span style={{
                                    marginLeft: 'auto',
                                    background: badgeDanger ? 'rgba(239,68,68,0.18)' : '#1f2a44',
                                    color:      badgeDanger ? '#ef4444' : '#94a3b8',
                                    fontSize:   10,
                                    padding:    '1px 6px',
                                    borderRadius: 8,
                                }}>{badge}</span>
                            )}
                            {/* Compact mode — dot indicator for badge */}
                            {compact && badge && (
                                <span style={{
                                    position:     'absolute',
                                    top:          6,
                                    right:        6,
                                    width:        7,
                                    height:       7,
                                    borderRadius: '50%',
                                    background:   badgeDanger ? '#ef4444' : '#94a3b8',
                                }} />
                            )}
                        </div>
                    )
                })}

                <div style={{ margin: '12px 0', borderTop: '1px solid #1f2a44' }} />

                {bottomItems.map(({ icon: Icon, label, page }) => {
                    const active = activePage === page
                    return (
                        <div
                            key={page}
                            onClick={() => onNavigate(page)}
                            title={compact ? label : undefined}
                            style={itemStyle(active)}
                            onMouseEnter={e => hoverOn(e, active)}
                            onMouseLeave={e => hoverOff(e, active)}
                        >
                            <Icon size={16} />
                            {!compact && label}
                        </div>
                    )
                })}
            </div>

            {/* User */}
            {!compact && (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #1f2a44', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#3b82f6,#1e40af)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'white', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
                        <div style={{ color: '#94a3b8', fontSize: 11 }}>{plan} plan</div>
                    </div>
                    <button
                        onClick={onLogout}
                        title="Logout"
                        style={{ color: '#64748b', padding: 4, cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* Compact user avatar */}
            {compact && (
                <div style={{ padding: '12px 0', borderTop: '1px solid #1f2a44', display: 'flex', justifyContent: 'center' }}>
                    <div
                        onClick={onLogout}
                        title={`${username} — Logout`}
                        style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#3b82f6,#1e40af)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                    >
                        {initials}
                    </div>
                </div>
            )}
        </aside>
    )
}
