import { motion } from 'framer-motion'

export function MiniChart() {
  const data = [42, 68, 51, 85, 96, 112, 78]
  const max = Math.max(...data)
  const W = 260, H = 55
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - (v / max) * H * 0.82 }))
  const line = pts.reduce((a, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const cx = (pts[i - 1].x + p.x) / 2
    return `${a} C ${cx} ${pts[i - 1].y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }, '')
  const fill = `${line} L ${pts.at(-1)!.x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 55 }}>
      <defs>
        <linearGradient id="mcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <motion.path d={fill} fill="url(#mcFill)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} />
      <motion.path d={line} fill="none" stroke="#D4AF37" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} />
    </svg>
  )
}
