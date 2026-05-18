import { useEffect, useState } from 'react'
import { Activity, ShieldX, AlertTriangle, Clock } from 'lucide-react'

import Sidebar, { type Page } from '../components/layout/Sidebar'
import KpiCard          from '../components/ui/KpiCard'
import AreaChartCard    from '../components/charts/AreaChartCard'
import DonutChart       from '../components/charts/DonutChart'
import DualBarChart     from '../components/charts/DualBarChart'
import GaugeChart       from '../components/charts/GaugeChart'
import StackedAreaChart from '../components/charts/StackedAreaChart'

import {
    kpiData, requestVolumeData, statusCodeData,
    trafficByDayData, rateLimitUsage, topEndpoints,
    threatData, blockedIPs,
} from '../mocks/dashboardData'
import client from '../api/client'
import type { TenantInfo, ApiKey } from '../api/types'
import { useSecurityEvents } from '../hooks/useSecurityEvents'
import { useBreakpoint } from '../hooks/useWindowSize'

interface Props { onLogout: () => void }

const severityStyle: Record<string, { bg: string; color: string }> = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    WARNING:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    SUCCESS:  { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    INFO:     { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
}

function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60)    return `${diff}s ago`
    if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

function PlaceholderPage({ page }: { page: Page }) {
    const titles: Partial<Record<Page, string>> = {
        'api-keys': 'API Keys', 'security-events': 'Security Events',
        'analytics': 'Analytics', 'blocked-ips': 'Blocked IPs',
        'rate-limits': 'Rate Limits', 'billing': 'Billing', 'settings': 'Settings',
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
            <div style={{ fontSize: 48 }}>🚧</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#64748b' }}>{titles[page]}</div>
            <div style={{ fontSize: 13, color: '#475569' }}>Coming soon</div>
        </div>
    )
}

export default function DashboardPage({ onLogout }: Props) {
    const username   = localStorage.getItem('username') || 'User'
    const { isLarge, isMedium } = useBreakpoint()

    const [activePage, setActivePage] = useState<Page>('overview')
    const [tenant,     setTenant]     = useState<TenantInfo | null>(null)
    const [apiKeys,    setApiKeys]    = useState<ApiKey[]>([])
    const [evtFilter,  setEvtFilter]  = useState<'all' | 'critical'>('all')
    const [evtPage,    setEvtPage]    = useState(0)

    useEffect(() => {
        Promise.all([
            client.get<TenantInfo>('/api/v1/tenant/me'),
            client.get<ApiKey[]>('/api/v1/api-keys'),
        ]).then(([t, k]) => {
            setTenant(t.data)
            setApiKeys(k.data)
        }).catch(console.error)
    }, [])

    const eventsQuery = useSecurityEvents({
        page:     evtPage,
        size:     15,
        severity: evtFilter === 'critical' ? 'CRITICAL' : undefined,
    })

    const handleFilterChange = (f: 'all' | 'critical') => {
        setEvtFilter(f)
        setEvtPage(0)
    }

    const plan       = tenant?.plan ?? 'FREE'
    const activeKeys = apiKeys.filter(k => k.active).length

    const kpis = [
        { key: 'requests',  label: 'TOTAL REQUESTS',  value: '60.8K', delta: kpiData.totalRequests.delta,  trend: kpiData.totalRequests.trend,  color: '#3b82f6', subtitle: 'vs 54.0K last week',     icon: <Activity size={12} /> },
        { key: 'blocked',   label: 'BLOCKED',          value: '1,247', delta: -kpiData.blocked.delta,       trend: kpiData.blocked.trend,        color: '#ef4444', subtitle: '2.05% of total traffic', icon: <ShieldX size={12} color="#ef4444" /> },
        { key: 'ratelimit', label: 'RATE LIMIT HITS',  value: '432',   delta: kpiData.rateLimitHits.delta,  trend: kpiData.rateLimitHits.trend,  color: '#f59e0b', subtitle: 'avg 61/day',             icon: <AlertTriangle size={12} color="#f59e0b" /> },
        { key: 'latency',   label: 'AVG LATENCY',      value: '42ms',  delta: kpiData.avgLatencyMs.delta,   trend: kpiData.avgLatencyMs.trend,   color: '#a78bfa', subtitle: 'p99: 128ms',             icon: <Clock size={12} color="#a78bfa" /> },
    ]

    const breadcrumbMap: Partial<Record<Page, string>> = {
        'api-keys': 'API Keys', 'security-events': 'Security Events',
        'analytics': 'Analytics', 'blocked-ips': 'Blocked IPs',
        'rate-limits': 'Rate Limits', 'billing': 'Billing', 'settings': 'Settings',
    }
    const breadcrumb = activePage === 'overview' ? 'Overview' : (breadcrumbMap[activePage] ?? '')

    // ── Responsive grid column definitions ───────────────────────────────────
    const sidebarWidth    = isLarge ? '220px' : isMedium ? '180px' : '0px'
    const kpiCols         = isLarge ? 'repeat(4,1fr)' : 'repeat(2,1fr)'
    const areaDonutCols   = isLarge ? '1.6fr 1fr'     : '1fr'
    const barGaugeEpCols  = isLarge ? '1.2fr 1fr 1fr' : isMedium ? '1fr 1fr' : '1fr'
    const stackedIpsCols  = isLarge ? '1.4fr 1fr'     : '1fr'

    return (
        <div style={{ background: '#0b1220', padding: isLarge ? 20 : 12, minHeight: '100vh' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: `${sidebarWidth} 1fr`,
                gap: isLarge ? 20 : 12,
                maxWidth: 1400,
                margin: '0 auto',
            }}>

                {/* Sidebar — hidden on small screens */}
                {!isLarge && !isMedium ? null : (
                    <Sidebar
                        activePage={activePage}
                        onNavigate={setActivePage}
                        onLogout={onLogout}
                        username={username}
                        plan={plan}
                        compact={isMedium}
                    />
                )}

                <main style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>
                                Dashboard <span style={{ margin: '0 6px' }}>›</span> {breadcrumb}
                            </div>
                            <div style={{ color: 'white', fontSize: 18, fontWeight: 500 }}>API traffic analytics</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ background: '#151f36', border: '1px solid #1f2a44', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#94a3b8' }}>
                                {plan} · {activeKeys} keys active
                            </div>
                            <button
                                style={{ background: '#3b82f6', color: 'white', fontSize: 12, padding: '7px 14px', borderRadius: 6, cursor: 'pointer', border: 'none' }}
                                onClick={() => setActivePage('api-keys')}
                            >
                                + New key
                            </button>
                        </div>
                    </div>

                    {/* Route switch */}
                    {activePage !== 'overview' ? <PlaceholderPage page={activePage} /> : (
                        <>
                            {/* KPI row — 4 cols on large, 2x2 on medium/small */}
                            <div style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: 12 }}>
                                {kpis.map(({ key, ...kpi }) => <KpiCard key={key} {...kpi} />)}
                            </div>

                            {/* Area chart + Donut — side by side on large, stacked on medium */}
                            <div style={{ display: 'grid', gridTemplateColumns: areaDonutCols, gap: 14 }}>
                                <AreaChartCard data={requestVolumeData} />
                                <DonutChart    data={statusCodeData} />
                            </div>

                            {/* Bar + Gauge + Top endpoints */}
                            <div style={{ display: 'grid', gridTemplateColumns: barGaugeEpCols, gap: 14 }}>
                                <DualBarChart data={trafficByDayData} />
                                <GaugeChart   {...rateLimitUsage} />

                                {/* Top endpoints — hidden on small, shown as 3rd col on large, new row on medium */}
                                {(isLarge || isMedium) && (
                                    <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 18 }}>
                                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Top endpoints</div>
                                        <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 14 }}>Most called paths (7d)</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                                            {topEndpoints.map((ep) => {
                                                const pct = Math.round((ep.count / topEndpoints[0].count) * 100)
                                                return (
                                                    <div key={ep.path}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                                                            <span style={{ color: 'white', fontFamily: 'ui-monospace,monospace' }}>{ep.path}</span>
                                                            <span style={{ color: '#94a3b8' }}>{(ep.count / 1000).toFixed(1)}K</span>
                                                        </div>
                                                        <div style={{ height: 5, background: '#1f2a44', borderRadius: 3, overflow: 'hidden' }}>
                                                            <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', borderRadius: 3 }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Stacked area + Blocked IPs */}
                            <div style={{ display: 'grid', gridTemplateColumns: stackedIpsCols, gap: 14 }}>
                                <StackedAreaChart data={threatData} />
                                <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 18 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>Top blocked IPs</div>
                                        <div style={{ color: '#ef4444', fontSize: 11, background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 4 }}>12 active</div>
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 14 }}>Attack sources by volume</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                        {blockedIPs.map(ip => (
                                            <div key={ip.ip} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 11px', background: '#0b1220', borderRadius: 6, borderLeft: `2px solid ${ip.color}` }}>
                                                <div>
                                                    <div style={{ color: 'white', fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>{ip.ip}</div>
                                                    <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{ip.type} · {ip.country}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ color: ip.color, fontSize: 13, fontWeight: 500 }}>{ip.attempts}</div>
                                                    <div style={{ color: '#64748b', fontSize: 9 }}>attempts</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Security events table */}
                            <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>Recent security events</div>
                                        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                                            {eventsQuery.isLoading  ? 'Loading…'
                                                : eventsQuery.isError    ? 'Failed to load'
                                                    : `Live audit feed · ${eventsQuery.data?.totalElements ?? 0} total`}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {(['all', 'critical'] as const).map(f => (
                                            <div key={f} onClick={() => handleFilterChange(f)} style={{
                                                background:  evtFilter === f ? 'rgba(59,130,246,0.15)' : '#0b1220',
                                                border:      `1px solid ${evtFilter === f ? '#3b82f6' : '#1f2a44'}`,
                                                color:       evtFilter === f ? '#60a5fa' : '#94a3b8',
                                                borderRadius: 6, padding: '5px 10px', fontSize: 11,
                                                cursor: 'pointer', userSelect: 'none', textTransform: 'capitalize',
                                                transition: 'all 0.15s',
                                            }}>{f}</div>
                                        ))}
                                        <div onClick={() => setActivePage('security-events')} style={{ color: '#3b82f6', fontSize: 12, alignSelf: 'center', cursor: 'pointer' }}>
                                            View all →
                                        </div>
                                    </div>
                                </div>

                                {eventsQuery.isLoading && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} style={{ height: 36, background: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
                                        ))}
                                    </div>
                                )}

                                {eventsQuery.isError && (
                                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#ef4444', fontSize: 13 }}>
                                        Failed to load events.{' '}
                                        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => eventsQuery.refetch()}>Retry</span>
                                    </div>
                                )}

                                {eventsQuery.isSuccess && (
                                    <>
                                        {/* On small screens hide less important columns */}
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 500 }}>
                                                <thead>
                                                <tr style={{ color: '#64748b', textAlign: 'left' }}>
                                                    {['TIME', 'EVENT', 'SOURCE IP', 'ENDPOINT', 'STATUS', 'SEVERITY'].map((h, i) => (
                                                        <th key={h} style={{ padding: '8px 10px', fontWeight: 400, borderBottom: '1px solid #1f2a44', textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                                                    ))}
                                                </tr>
                                                </thead>
                                                <tbody style={{ color: '#94a3b8' }}>
                                                {eventsQuery.data.content.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} style={{ padding: '24px 10px', textAlign: 'center', color: '#475569' }}>No events found</td>
                                                    </tr>
                                                ) : eventsQuery.data.content.map((ev, i) => {
                                                    const s      = severityStyle[ev.severity] ?? severityStyle.INFO
                                                    const isLast = i === eventsQuery.data.content.length - 1
                                                    const td = (content: React.ReactNode, extra?: React.CSSProperties) => (
                                                        <td style={{ padding: '9px 10px', borderBottom: isLast ? 'none' : '1px solid #1f2a44', ...extra }}>{content}</td>
                                                    )
                                                    return (
                                                        <tr key={ev.id}>
                                                            {td(timeAgo(ev.createdAt))}
                                                            {td(ev.eventType.replace(/_/g, ' '), { color: 'white' })}
                                                            {td(ev.ipAddress, { fontFamily: 'ui-monospace,monospace' })}
                                                            {td(ev.endpoint ?? '—', { fontFamily: 'ui-monospace,monospace' })}
                                                            {td(ev.statusCode ?? '—')}
                                                            {td(
                                                                <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 4 }}>{ev.severity}</span>,
                                                                { textAlign: 'right' }
                                                            )}
                                                        </tr>
                                                    )
                                                })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {eventsQuery.data.totalPages > 1 && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #1f2a44' }}>
                                                <span style={{ color: '#64748b', fontSize: 11 }}>Page {evtPage + 1} of {eventsQuery.data.totalPages}</span>
                                                <button onClick={() => setEvtPage(p => p - 1)} disabled={evtPage === 0}
                                                        style={{ background: '#0b1220', border: '1px solid #1f2a44', color: evtPage === 0 ? '#334155' : '#94a3b8', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: evtPage === 0 ? 'not-allowed' : 'pointer' }}>
                                                    ← Prev
                                                </button>
                                                <button onClick={() => setEvtPage(p => p + 1)} disabled={eventsQuery.data.last}
                                                        style={{ background: '#0b1220', border: '1px solid #1f2a44', color: eventsQuery.data.last ? '#334155' : '#94a3b8', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: eventsQuery.data.last ? 'not-allowed' : 'pointer' }}>
                                                    Next →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
