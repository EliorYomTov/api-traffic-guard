import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

interface StatusCode { label: string; value: number; pct: number; color: string }

interface Props {
    data: StatusCode[]
    totalRequests?: number
    blockedRequests?: number
}

export default function DonutChart({ data, totalRequests, blockedRequests }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef  = useRef<Chart | null>(null)

    const allowed = (totalRequests ?? 0) - (blockedRequests ?? 0)
    const blocked = blockedRequests ?? 0

    useEffect(() => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')!
        chartRef.current?.destroy()
        chartRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [
                    {
                        data: data.map(d => d.pct),
                        backgroundColor: data.map(d => d.color),
                        borderColor: '#111a2e',
                        borderWidth: 3,
                        weight: 1,
                    },
                    {
                        data: [allowed, blocked],
                        backgroundColor: ['#3b82f6', '#ef4444'],
                        borderColor: '#111a2e',
                        borderWidth: 3,
                        weight: 0.5,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                },
            },
        })
        return () => chartRef.current?.destroy()
    }, [data, allowed, blocked])

    const total = data.reduce((sum, d) => sum + d.value, 0)
    const fmt   = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n)

    const gridItems = [
        ...data.map(({ label, value, pct, color }) => ({
            label, value: fmt(value), sub: `${pct}%`, color,
        })),
        { label: 'allowed', value: fmt(allowed), sub: '', color: '#3b82f6' },
        { label: 'blocked', value: fmt(blocked), sub: '', color: '#ef4444' },
    ]

    return (
        <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>Status codes</div>
                <div style={{ color: '#94a3b8', fontSize: 10, background: '#0b1220', border: '1px solid #1f2a44', padding: '2px 8px', borderRadius: 4 }}>7d</div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 14 }}>Response distribution</div>

            <div style={{ position: 'relative', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <canvas ref={canvasRef} />
                <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ color: 'white', fontSize: 26, fontWeight: 500 }}>{fmt(total)}</div>
                    <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>TOTAL</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                {gridItems.map(({ label, value, sub, color }) => (
                    <div key={label} style={{ background: '#0b1220', padding: '8px 10px', borderRadius: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#94a3b8' }}>
                            <span style={{ width: 6, height: 6, background: color, borderRadius: '50%', display: 'inline-block' }} />
                            {label}
                        </div>
                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500, marginTop: 2 }}>
                            {value} {sub && <span style={{ color: '#94a3b8', fontSize: 10 }}>{sub}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}