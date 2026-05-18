import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

interface Props {
    label: string
    value: string
    delta: number
    trend: number[]
    color: string
    subtitle: string
    icon: React.ReactNode
}

export default function KpiCard({ label, value, delta, trend, color, subtitle, icon }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<Chart | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')!
        const g = ctx.createLinearGradient(0, 0, 0, 36)
        g.addColorStop(0, color + '55')
        g.addColorStop(1, color + '00')

        chartRef.current?.destroy()
        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trend.map((_, i) => i),
                datasets: [{ data: trend, borderColor: color, backgroundColor: g, fill: true, tension: 0.4, borderWidth: 1.5, pointRadius: 0 }],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
                animation: { duration: 600 },
            },
        })
        return () => chartRef.current?.destroy()
    }, [trend, color])

    // For blocked/latency, going up is bad — caller decides color via `delta` sign
    const deltaColor  = delta > 0 ? '#22c55e' : '#ef4444'
    const deltaIcon   = delta > 0 ? '▲' : '▼'

    return (
        <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {icon}
                        {label}
                    </div>
                    <div style={{ color: 'white', fontSize: 22, fontWeight: 500 }}>{value}</div>
                </div>
                <div style={{ color: deltaColor, fontSize: 10, background: deltaColor + '22', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {deltaIcon} {Math.abs(delta)}%
                </div>
            </div>
            <div style={{ height: 36, position: 'relative' }}>
                <canvas ref={canvasRef} />
            </div>
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>{subtitle}</div>
        </div>
    )
}