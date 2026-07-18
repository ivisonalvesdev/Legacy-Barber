import { motion } from 'framer-motion'

export function MiniChart() {
  // Termina no ponto mais alto: a curva conta a história de crescimento
  const data = [38, 56, 48, 70, 64, 92, 118]
  const max = Math.max(...data)
  const W = 260, H = 55
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - (v / max) * H * 0.82 }))
  const line = pts.reduce((a, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const cx = (pts[i - 1].x + p.x) / 2
    return `${a} C ${cx} ${pts[i - 1].y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }, '')
  const fill = `${line} L ${pts.at(-1)!.x} ${H} L ${pts[0].x} ${H} Z`
  const last = pts.at(-1)!

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 55, overflow: 'visible' }}>
      <defs>
        <linearGradient id="mcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {/* Grade horizontal sutil */}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 5" />
      ))}

      <motion.path d={fill} fill="url(#mcFill)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} />
      <motion.path d={line} fill="none" stroke="#D4AF37" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} />

      {/* Ponto de "hoje": halo pulsante + rótulo */}
      <motion.circle cx={last.x} cy={last.y} r="7" fill="rgba(212,175,55,0.18)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0.3, 0.9], scale: [0.6, 1.25, 0.9, 1.25] }}
        transition={{ duration: 2.4, delay: 2.1, repeat: Infinity, repeatDelay: 0 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      <motion.circle cx={last.x} cy={last.y} r="2.6" fill="#D4AF37"
        stroke="rgba(7,7,7,0.9)" strokeWidth="1"
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, type: 'spring', stiffness: 300, damping: 18 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      <motion.text x={last.x - 9} y={last.y - 8} textAnchor="end"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3 }}
        style={{ fontSize: '7px', fontWeight: 700, fill: '#D4AF37', letterSpacing: '0.08em' }}>
        HOJE
      </motion.text>
    </svg>
  )
}
