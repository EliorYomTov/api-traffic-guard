import { useEffect, useRef } from 'react'

interface Props {
    pct: number
    used: number
    remaining: number
    resetsInSec: number
}

export default function GaugeChart({ pct, used, remaining, resetsInSec }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        const dpr  = window.devicePixelRatio || 1
        const size = 220
        canvas.width  = size * dpr
        canvas.height = size * dpr
        canvas.style.width  = size + 'px'
        canvas.style.height = size + 'px'
        ctx.scale(dpr, dpr)

        const cx = size / 2, cy = size / 2 + 10
        const radius = 80, strokeW = 12
        const startA = Math.PI
        const endA   = startA + (pct / 100) * Math.PI

        ctx.lineCap = 'round'

        // Track
        ctx.beginPath()
        ctx.arc(cx, cy, radius, startA, startA + Math.PI)
        ctx.strokeStyle = '#1f2a44'
        ctx.lineWidth = strokeW
        ctx.stroke()

        // Gradient arc
        const arcGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy)
        arcGrad.addColorStop(0, '#1d4ed8')
        arcGrad.addColorStop(0.5, '#3b82f6')
        arcGrad.addColorStop(1, '#93c5fd')
        ctx.beginPath()
        ctx.arc(cx, cy, radius, startA, endA)
        ctx.strokeStyle = arcGrad
        ctx.lineWidth = strokeW
        ctx.stroke()

        // Glowing dot at tip
        const dotX = cx + radius * Math.cos(endA)
        const dotY = cy + radius * Math.sin(endA)
        const halo  = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 18)
        halo.addColorStop(0, 'rgba(147,197,253,0.65)')
        halo.addColorStop(1, 'rgba(147,197,253,0)')
        ctx.beginPath(); ctx.arc(dotX, dotY, 18, 0, Math.PI * 2)
        ctx.fillStyle = halo; ctx.fill()
        ctx.beginPath(); ctx.arc(dotX, dotY, 7, 0, Math.PI * 2)
        ctx.fillStyle = 'white'; ctx.fill()
        ctx.beginPath(); ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#3b82f6'; ctx.fill()
    }, [pct])

    const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n

    return (
        <div style={{ background: '#111a2e', border: '1px solid #1f2a44', borderRadius: 10, padding: 18 }}>
            <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>Rate limit usage</div>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>Current quota consumption</div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }} />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 30 }}>
                    <div style={{ color: 'white', fontSize: 32, fontWeight: 600, lineHeight: 1 }}>{pct}%</div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>of quota used</div>
                </div>
            </div>

            <div style={{ color: '#64748b', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>
                Resets in <span style={{ color: 'white', fontWeight: 500 }}>{resetsInSec}s</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #1f2a44' }}>
                <div><div style={{ color: '#64748b', fontSize: 10 }}>USED</div><div style={{ color: 'white', fontSize: 13, fontWeight: 500, marginTop: 2 }}>{fmt(used)}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 10 }}>REMAINING</div><div style={{ color: '#22c55e', fontSize: 13, fontWeight: 500, marginTop: 2 }}>{fmt(remaining)}</div></div>
            </div>
        </div>
    )
}