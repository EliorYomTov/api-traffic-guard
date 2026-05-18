import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

interface DataPoint { day: string; bruteForce: number; rateLimit: number; badKey: number }
interface Props { data: DataPoint[] }

export default function StackedAreaChart({ data }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef  = useRef<Chart | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')!
        chartRef.current?.destroy()
        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.day),
                datasets: [
                    {
                        label: 'Brute force',
                        data: data.map(d => d.bruteForce),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239,68,68,0.28)',
                        fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
                    },
                    {
                        label: 'Rate limit',
                        data: data.map(d => d.rateLimit),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245,158,11,0.28)',
                        fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
                    },
                    {
                        label: 'Bad key',
                        data: data.map(d => d.badKey),
                        borderColor: '#a78bfa',
                        backgroundColor: 'rgba(167,139,250,0.28)',
                        fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0b1220', borderColor: '#1f2a44', borderWidth: 1,
                        mode: 'index', intersect: false,
                    },
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } }, stacked: true, border: { display: false } },
                    y: { grid: { color: 'rgba(31,42,68,0.5)' }, ticks: { color: '#64748b', font: { size: 10 } }, stacked: true, border: { display: false } },
                },
            },
        })
        return () => chartRef.current?.destroy()
    }, [data])

    const legends = [
        { label: 'Brute force', color: '#ef4444' },
        { label: 'Rate limit',  color: '#f59e0b' },
        { label: 'Bad key',     color: '#a78bfa' },
    ]

    return (
        <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                    <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>Threat composition</div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Stacked breakdown over time</div>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
                    {legends.map(({ label, color }) => (
                        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
              <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: 'inline-block' }} />
                            {label}
            </span>
                    ))}
                </div>
            </div>
            <div style={{ position: 'relative', height: 200, marginTop: 14 }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    )
}