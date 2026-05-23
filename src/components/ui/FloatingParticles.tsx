import { motion } from 'framer-motion'
import { PARTICLES } from '../../data/mock'

export function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: 'rgba(212,175,55,0.5)' }}
          animate={{ y: [0, -p.amp, 0], opacity: [0.15, 0.65, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
