import { motion, useReducedMotion } from 'framer-motion'
import { SnipScissors } from './SnipScissors'

// Espalhadas pelas bordas e alguns vãos do miolo — nunca em cima do conteúdo
// principal. Opacidade baixa: é textura de fundo, não protagonista.
const ITEMS = [
  { top: '6%',  left: '30%', size: 18, dur: 17, delay: 0,   rot: 22,  op: 0.11 },
  { top: '12%', left: '78%', size: 15, dur: 20, delay: 2.2, rot: -30, op: 0.09 },
  { top: '30%', left: '94%', size: 20, dur: 18, delay: 1,   rot: -14, op: 0.11 },
  { top: '46%', left: '38%', size: 13, dur: 24, delay: 5.5, rot: 12,  op: 0.07 },
  { top: '58%', left: '85%', size: 16, dur: 21, delay: 3.4, rot: 46,  op: 0.10 },
  { top: '70%', left: '28%', size: 14, dur: 23, delay: 4.6, rot: -40, op: 0.08 },
  { top: '84%', left: '62%', size: 21, dur: 19, delay: 1.6, rot: 32,  op: 0.11 },
  { top: '90%', left: '90%', size: 15, dur: 22, delay: 6,   rot: -22, op: 0.09 },
]

/**
 * Fundo temático das áreas logadas (cliente, barbeiro e admin): tesouras
 * douradas bem discretas, flutuando devagar e cortando o ar de vez em
 * quando. Sem efeito magnético — é ambiente, não interação.
 */
export function ScissorsBackdrop() {
  const reduced = useReducedMotion()

  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {ITEMS.map((it, i) => (
        <motion.div key={i}
          initial={{ opacity: 0 }}
          animate={reduced
            ? { opacity: it.op }
            : { opacity: [it.op * 0.7, it.op * 1.5, it.op * 0.7], y: [0, -18, 0] }}
          transition={{ duration: it.dur, delay: it.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: it.top, left: it.left,
            rotate: `${it.rot}deg`,
            filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.25))',
          }}>
          <SnipScissors size={it.size} speed={4.5 + (i % 3)} delay={it.delay} />
        </motion.div>
      ))}
    </div>
  )
}
