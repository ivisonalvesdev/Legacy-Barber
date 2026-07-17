import { useState } from 'react'
import { motion } from 'framer-motion'

type Point = { day: string; value: number }

interface RevenueChartProps {
  /** Dados reais dos últimos 7 dias. */
  data: Point[]
}

const EMPTY_WEEK: Point[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  .map(day => ({ day, value: 0 }))

export function RevenueChart({ data }: RevenueChartProps) {
  const [hov, setHov] = useState<number | null>(null)
  const chartData = data.length > 0 ? data : EMPTY_WEEK

  const W = 600, H = 160
  const P = { t: 10, r: 20, b: 28, l: 10 }
  const iW = W - P.l - P.r
  const iH = H - P.t - P.b
  const max = Math.max(...chartData.map(d => d.value), 1)
  const xOf = (i: number) => P.l + (i / (chartData.length - 1)) * iW
  const yOf = (v: number) => P.t + iH - (v / max) * iH * 0.88
  const pts = chartData.map((d, i) => ({ ...d, x: xOf(i), y: yOf(d.value) }))
  const line = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }, '')
  const fill = `${line} L ${pts.at(-1)!.x} ${H - P.b} L ${pts[0].x} ${H - P.b} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      <defs>
        <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"    />
        </linearGradient>
        <linearGradient id="lG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#7A5F18" />
          <stop offset="50%"  stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F0D060" />
        </linearGradient>
        <filter id="gF">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.33, 0.66, 1].map((t, i) => (
        <line key={i}
          x1={P.l} y1={P.t + iH * (1 - t * 0.88)}
          x2={W - P.r} y2={P.t + iH * (1 - t * 0.88)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <motion.path d={fill} fill="url(#aG)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} />
      <motion.path d={line} fill="none" stroke="url(#lG)" strokeWidth="2.5" filter="url(#gF)"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }} />
      {pts.map((p, i) => (
        <g key={i}>
          <rect x={p.x - 22} y={P.t} width={44} height={iH} fill="transparent" style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          <motion.circle cx={p.x} cy={p.y}
            r={hov === i ? 5.5 : 3.5}
            fill={hov === i ? '#F0D060' : '#D4AF37'}
            stroke={hov === i ? 'rgba(212,175,55,0.35)' : 'transparent'}
            strokeWidth={hov === i ? 6 : 0}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            style={{ filter: hov === i ? 'drop-shadow(0 0 7px rgba(212,175,55,0.9))' : 'none' }} />
          {hov === i && (
            <g>
              <rect x={p.x - 40} y={p.y - 38} width={80} height={26} rx={6}
                fill="rgba(12,12,12,0.96)" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
              <text x={p.x} y={p.y - 21} textAnchor="middle"
                fill="#D4AF37" fontSize="11.5" fontFamily="DM Sans" fontWeight="700">
                R$ {p.value.toLocaleString('pt-BR')}
              </text>
            </g>
          )}
          <text x={p.x} y={H - 4} textAnchor="middle"
            fill="rgba(161,161,170,0.58)" fontSize="10" fontFamily="DM Sans">{p.day}</text>
        </g>
      ))}
    </svg>
  )
}
