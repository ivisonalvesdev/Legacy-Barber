import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion, useTransform } from 'framer-motion'

/**
 * Fundo com profundidade: camadas em "planos" diferentes que se deslocam em
 * velocidades distintas conforme o mouse (parallax) — cria a sensação 3D sem
 * o peso de uma engine WebGL. Cada camada tem um fator de profundidade próprio:
 * quanto maior, mais ela reage e mais "à frente" parece estar.
 */
export function AmbientBackground() {
  const reduced = useReducedMotion()

  // Posição do mouse normalizada em [-1, 1], suavizada por spring.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 })

  useEffect(() => {
    if (reduced) return
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduced, mx, my])

  // Cada plano desloca por um fator (px) — sinais opostos dão contra-parallax,
  // reforçando a separação de profundidade. Hooks declarados no corpo (não em
  // função auxiliar) para respeitar as regras dos hooks.
  const p1x = useTransform(sx, v => v * -34); const p1y = useTransform(sy, v => v * -34)  // distante
  const p2x = useTransform(sx, v => v *  22); const p2y = useTransform(sy, v => v *  22)
  const p3x = useTransform(sx, v => v * -52); const p3y = useTransform(sy, v => v * -52)
  const p4x = useTransform(sx, v => v *  40); const p4y = useTransform(sy, v => v *  40)  // frente

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0, perspective: 1000 }}>
      {/* Plano 1 — brilho dourado superior esquerdo (distante) */}
      <motion.div
        style={{ x: p1x, y: p1y, willChange: 'transform' }}
        className="absolute -top-40 -left-40 w-[720px] h-[720px] rounded-full">
        <motion.div
          animate={reduced ? {} : { opacity: [0.2, 0.3, 0.2], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.28) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </motion.div>

      {/* Plano 2 — âmbar inferior direito */}
      <motion.div
        style={{ x: p2x, y: p2y, willChange: 'transform' }}
        className="absolute -bottom-48 -right-48 w-[840px] h-[840px] rounded-full">
        <motion.div
          animate={reduced ? {} : { opacity: [0.1, 0.18, 0.1], scale: [1, 1.05, 1] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(184,149,31,0.24) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </motion.div>

      {/* Plano 3 — halo central sutil (distante, contra-move) */}
      <motion.div
        style={{ x: p3x, y: p3y, willChange: 'transform' }}
        className="absolute top-1/2 left-1/2 w-[1300px] h-[640px]"
        initial={false}>
        <div className="w-full h-full -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.12) 0%, transparent 65%)', filter: 'blur(100px)' }} />
      </motion.div>

      {/* Plano 4 — vinheta na frente, dá foco ao centro */}
      <motion.div
        style={{ x: p4x, y: p4y, willChange: 'transform' }}
        className="absolute inset-[-10%]">
        <div className="w-full h-full"
          style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)' }} />
      </motion.div>
    </div>
  )
}
