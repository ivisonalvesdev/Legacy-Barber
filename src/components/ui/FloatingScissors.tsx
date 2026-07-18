import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { SnipScissors } from './SnipScissors'

type Item = {
  top: string; left: string
  size: number     // px do ícone
  dur: number      // duração do bob (flutuação)
  delay: number    // defasagem entre as tesouras
  rot: number      // inclinação base
  snip: number     // duração do ciclo de corte
}

// Layouts por seção — posições diferentes para as tesouras ficarem bem
// espalhadas pela página, sem aglomerar em um lugar só.
const LAYOUTS: Record<'hero' | 'features' | 'cta', Item[]> = {
  hero: [
    { top: '12%', left: '3%',   size: 26, dur: 11, delay: 0,   rot: 18,  snip: 2.2 },
    { top: '55%', left: '2%',   size: 18, dur: 14, delay: 1.4, rot: -28, snip: 2.8 },
    { top: '86%', left: '10%',  size: 22, dur: 13, delay: 0.9, rot: 40,  snip: 2.5 },
    { top: '7%',  left: '52%',  size: 16, dur: 15, delay: 2.2, rot: -12, snip: 3.1 },
    { top: '16%', left: '93%',  size: 20, dur: 12, delay: 0.5, rot: -20, snip: 2.4 },
    { top: '58%', left: '96%',  size: 15, dur: 16, delay: 3,   rot: 52,  snip: 2.9 },
    { top: '88%', left: '88%',  size: 28, dur: 14, delay: 1.8, rot: 30,  snip: 2.1 },
  ],
  features: [
    { top: '8%',  left: '2.5%', size: 20, dur: 13, delay: 0.3, rot: 24,  snip: 2.6 },
    { top: '66%', left: '4%',   size: 15, dur: 15, delay: 1.7, rot: -36, snip: 3.0 },
    { top: '16%', left: '95%',  size: 17, dur: 14, delay: 0.8, rot: -16, snip: 2.4 },
    { top: '74%', left: '93%',  size: 23, dur: 12, delay: 2.4, rot: 44,  snip: 2.7 },
  ],
  cta: [
    { top: '16%', left: '10%',  size: 21, dur: 12, delay: 0.4, rot: -22, snip: 2.3 },
    { top: '72%', left: '6%',   size: 16, dur: 15, delay: 1.9, rot: 34,  snip: 2.8 },
    { top: '22%', left: '88%',  size: 18, dur: 13, delay: 1.1, rot: 14,  snip: 2.5 },
    { top: '76%', left: '91%',  size: 24, dur: 14, delay: 2.7, rot: -40, snip: 2.2 },
  ],
}

// Efeito magnético: dentro deste raio a tesoura é puxada em direção ao
// cursor, com força e escala proporcionais à proximidade.
const RADIUS = 300
const PULL   = 65

function MagneticSnip({ it, reduced }: { it: Item; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const s = useMotionValue(1)
  const sx = useSpring(x, { stiffness: 140, damping: 15, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 140, damping: 15, mass: 0.5 })
  const ss = useSpring(s, { stiffness: 220, damping: 22 })

  useEffect(() => {
    if (reduced) return
    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      // O wrapper (ref) nunca é transformado — o rect é a posição base
      // estável, sem retroalimentação do próprio deslocamento magnético.
      const r  = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d  = Math.hypot(dx, dy)
      if (d < RADIUS && d > 1) {
        const f = 1 - d / RADIUS
        x.set((dx / d) * f * PULL)
        y.set((dy / d) * f * PULL)
        s.set(1 + f * 0.5)
      } else {
        x.set(0); y.set(0); s.set(1)
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduced, x, y, s])

  return (
    <div ref={ref} style={{ position: 'absolute', top: it.top, left: it.left }}>
      <motion.div style={{ x: sx, y: sy, scale: ss }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={reduced
            ? { opacity: 0.35 }
            : { opacity: [0.3, 0.5, 0.3], y: [0, -14, 0] }}
          transition={{ duration: it.dur, delay: it.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{ rotate: it.rot, filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.45))' }}>
          <SnipScissors size={it.size} speed={it.snip} delay={it.delay} />
        </motion.div>
      </motion.div>
    </div>
  )
}

/**
 * Tesouras douradas que cortam o ar e são atraídas pelo cursor (efeito
 * magnético). Cada seção usa um layout próprio para espalhar bem.
 * pointer-events off — nunca atrapalham cliques.
 */
export function FloatingScissors({ variant = 'hero' }: { variant?: 'hero' | 'features' | 'cta' }) {
  const reduced = useReducedMotion()

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {LAYOUTS[variant].map((it, i) => (
        <MagneticSnip key={i} it={it} reduced={!!reduced} />
      ))}
    </div>
  )
}
