import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

interface DataPoint { day: string; allowed: number; blocked: number }
interface Props { data: DataPoint[] }

export default function DualBarChart({ data }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef  = useRef<Chart | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')!
        chartRef.current?.destroy()
        chartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.day),
                datasets: [
                    {
                        label: 'Allowed',
                        data: data.map(d => d.allowed),
                        backgroundColor: '#3b82f6',
                        borderRadius: { topLeft: 3, topRight: 3 },
                        borderSkipped: false,
                        barThickness: 10,
                    },
                    {
                        label: 'Blocked',
                        data: data.map(d => d.blocked),
                        backgroundColor: 'rgba(148,163,184,0.4)',
                        borderRadius: { topLeft: 3, topRight: 3 },
                        borderSkipped: false,
                        barThickness: 10,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#0f172a', borderColor: '#1f2a44', borderWidth: 1, titleColor: '#94a3b8', bodyColor: 'white', padding: 10, mode: 'index' },
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 } }, border: { display: false } },
                    y: { grid: { color: 'rgba(31,42,68,0.5)' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => Number(v) >= 1000 ? (Number(v)/1000).toFixed(0)+'K' : v }, border: { display: false }},
                },
            },
        })
        return () => chartRef.current?.destroy()
    }, [data])

    return (
        <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>Traffic by day</div>
                <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 10 }}>
            <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: 2, display: 'inline-block' }} />Allowed
          </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 10 }}>
            <span style={{ width: 8, height: 8, background: 'rgba(148,163,184,0.45)', borderRadius: 2, display: 'inline-block' }} />Blocked
          </span>
                </div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 14 }}>Direct vs organic comparison</div>
            <div style={{ position: 'relative', height: 220 }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    )
}