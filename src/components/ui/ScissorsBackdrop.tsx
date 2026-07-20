import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SnipScissors } from './SnipScissors'

type Cross = {
  top:   string
  size:  number
  dur:   number
  delay: number
  dir:   1 | -1
  snip:  number
  op:    number
}

// Mesma ideia da landing, porém mais discreto: é textura de fundo das áreas
// logadas (cliente, barbeiro e admin), não pode competir com o conteúdo.
function makeCrossings(count: number): Cross[] {
  const rand = (a: number, b: number) => a + Math.random() * (b - a)
  return Array.from({ length: count }, (_, i) => ({
    top:   `${rand(3, 94).toFixed(1)}%`,
    size:  Math.round(rand(13, 24)),
    dur:   rand(15, 24),
    delay: rand(0, 16),
    dir:   (i % 2 === 0 ? 1 : -1) as 1 | -1,
    snip:  rand(0.5, 0.9),               // corte rápido
    op:    rand(0.08, 0.16),             // bem sutil no fundo do dashboard
  }))
}

function Crossing({ c }: { c: Cross }) {
  const from = c.dir === 1 ? '-12vw' : '112vw'
  const to   = c.dir === 1 ? '112vw' : '-12vw'
  const flip = c.dir === -1 ? -1 : 1

  return (
    <motion.div
      initial={{ x: from }}
      animate={{ x: [from, to] }}
      transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'linear' }}
      style={{
        position: 'absolute',
        top: c.top,
        left: 0,
        opacity: c.op,
        scaleX: flip,
        filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.22))',
        willChange: 'transform',
      }}>
      <SnipScissors size={c.size} speed={c.snip} delay={c.delay} />
    </motion.div>
  )
}

/**
 * Fundo temático das áreas logadas: tesouras douradas bem discretas
 * atravessando a tela nas duas direções e cortando o ar. Sem interação —
 * é ambiente, não protagonista. pointer-events off.
 */
export function ScissorsBackdrop() {
  const reduced = useReducedMotion()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const crossings = useMemo(() => makeCrossings(8), [])

  if (reduced) return null

  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {crossings.map((c, i) => <Crossing key={i} c={c} />)}
    </div>
  )
}
