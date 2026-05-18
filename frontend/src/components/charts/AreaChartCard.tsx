import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

interface DataPoint { month: string; allowed: number; blocked: number }

interface Props {
    data: DataPoint[]
    total?: number
    delta?: number | null
    subtitle?: string
    onRangeChange?: (range: '30d' | '7d' | '24h') => void
    activeRange?: '30d' | '7d' | '24h'
}

const glowPlugin = {
    id: 'glowDot',
    afterDraw(chart: Chart) {
        const meta = chart.getDatasetMeta(0)
        const last = meta.data[meta.data.length - 1]
        if (!last) return
        const { ctx } = chart
        const x = (last as any).x, y = (last as any).y
        ctx.save()
        const halo = ctx.createRadialGradient(x, y, 0, x, y, 16)
        halo.addColorStop(0, 'rgba(59,130,246,0.55)')
        halo.addColorStop(1, 'rgba(59,130,246,0)')
        ctx.fillStyle = halo
        ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'white'
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
    }
}

const TABS: { label: string; range: '30d' | '7d' | '24h' }[] = [
    { label: 'Month', range: '30d' },
    { label: 'Week',  range: '7d'  },
    { label: 'Day',   range: '24h' },
]

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
    return n.toLocaleString()
}

export default function AreaChartCard({
                                          data,
                                          total,
                                          delta,
                                          subtitle = 'last 7 days',
                                          onRangeChange,
                                          activeRange = '7d',
                                      }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef  = useRef<Chart | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')!

        const gradAllowed = ctx.createLinearGradient(0, 0, 0, 230)
        gradAllowed.addColorStop(0, 'rgba(59,130,246,0.55)')
        gradAllowed.addColorStop(0.5, 'rgba(59,130,246,0.18)')
        gradAllowed.addColorStop(1, 'rgba(59,130,246,0)')

        const gradBlocked = ctx.createLinearGradient(0, 0, 0, 230)
        gradBlocked.addColorStop(0, 'rgba(148,163,184,0.20)')
        gradBlocked.addColorStop(1, 'rgba(148,163,184,0)')

        chartRef.current?.destroy()
        chartRef.current = new Chart(ctx, {
            type: 'line',
            plugins: [glowPlugin],
            data: {
                labels: data.map(d => d.month),
                datasets: [
                    {
                        label: 'Allowed',
                        data: data.map(d => d.allowed),
                        borderColor: '#3b82f6', backgroundColor: gradAllowed,
                        fill: true, tension: 0.5, borderWidth: 3,
                        pointRadius: 0, pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#3b82f6', pointHoverBorderColor: 'white', pointHoverBorderWidth: 2,
                    },
                    {
                        label: 'Blocked',
                        data: data.map(d => d.blocked),
                        borderColor: 'rgba(148,163,184,0.7)', backgroundColor: gradBlocked,
                        fill: true, tension: 0.5, borderWidth: 2,
                        pointRadius: 0, pointHoverRadius: 5,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a', borderColor: '#1f2a44', borderWidth: 1,
                        titleColor: '#94a3b8', bodyColor: 'white', padding: 12,
                        callbacks: { label: item => ` ${item.dataset.label}: ${((item.raw as number) / 1000).toFixed(1)}K` },
                    },
                },
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 } }, border: { display: false } },
                    y: { grid: { color: 'rgba(31,42,68,0.6)' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => v === 0 ? '0' : fmt(Number(v)) }, border: { display: false } },
                },
            },
        })
        return () => chartRef.current?.destroy()
    }, [data])

    const deltaColor    = delta == null ? '#94a3b8' : delta >= 0 ? '#22c55e' : '#ef4444'
    const deltaArrow    = delta == null ? '' : delta >= 0 ? '▲ ' : '▼ '
    const deltaText     = delta == null ? '—' : `${deltaArrow}${Math.abs(delta)}%`
    const deltaBg       = delta == null ? 'rgba(148,163,184,0.15)' : delta >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'

    return (
        <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                    <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>Request volume</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                        <div style={{ color: 'white', fontSize: 24, fontWeight: 500 }}>
                            {total != null ? fmt(total) : '—'}
                        </div>
                        <div style={{ color: deltaColor, fontSize: 11, background: deltaBg, padding: '2px 6px', borderRadius: 4 }}>
                            {deltaText}
                        </div>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{subtitle}</div>
                </div>
                <div style={{ display: 'flex', background: '#0b1220', border: '1px solid #1f2a44', borderRadius: 6, padding: 2 }}>
                    {TABS.map(t => (
                        <div
                            key={t.range}
                            onClick={() => onRangeChange?.(t.range)}
                            style={{
                                padding: '4px 10px', fontSize: 11, borderRadius: 4,
                                color:      activeRange === t.range ? 'white' : '#94a3b8',
                                background: activeRange === t.range ? '#3b82f6' : 'transparent',
                                cursor: onRangeChange ? 'pointer' : 'default',
                            }}
                        >
                            {t.label}
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
                    <span style={{ width: 24, height: 2, background: '#3b82f6', display: 'inline-block', borderRadius: 2 }} />Allowed
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
                    <span style={{ width: 24, height: 2, background: 'rgba(148,163,184,0.6)', display: 'inline-block', borderRadius: 2 }} />Blocked
                </span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 230 }}>
                <canvas ref={canvasRef} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #1f2a44' }}>
                {[['PEAK HOUR','14:00',false],['PEAK DAY','Fri',false],['SUCCESS RATE','97.95%',true],['UPTIME','99.98%',true]].map(([label, val, green]) => (
                    <div key={label as string}>
                        <div style={{ color: '#64748b', fontSize: 10 }}>{label}</div>
                        <div style={{ color: green ? '#22c55e' : 'white', fontSize: 13, fontWeight: 500, marginTop: 2 }}>{val}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}