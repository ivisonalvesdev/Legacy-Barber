import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion, useTransform } from 'framer-motion'

/**
 * Fundo com profundidade: camadas em "planos" diferentes que se deslocam em
 * velocidades distintas conforme o mouse (parallax) — cria a sensação 3D sem
 * o peso de uma engine WebGL. Cada camada tem um fator de profundidade próprio:
 * quanto maior, mais ela reage e mais "à frente" parece estar.
 *
 * Anti-banding (visual "nível awwards"): gradientes escuros de baixa opacidade
 * costumam "escalonar" em faixas visíveis (banding) em telas de 8 bits. Duas
 * defesas: (1) as luzes usam paradas MÚLTIPLAS e mais suaves, alongando a
 * transição; (2) uma camada de grão (feTurbulence) por cima faz o dithering —
 * o ruído fininho quebra as faixas e o gradiente fica liso como veludo.
 */

// Grão gerado inteiramente por SVG (sem asset externo). baseFrequency alta =
// grão fino; fica quase invisível a olho nu, só o suficiente para dissolver as
// faixas do gradiente. Tile de 160px repetido cobre a viewport inteira.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

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
      {/* Plano 1 — brilho dourado superior esquerdo (distante).
          Paradas múltiplas (28→14→4→0) alongam a queda e evitam o degrau. */}
      <motion.div
        style={{ x: p1x, y: p1y, willChange: 'transform' }}
        className="absolute -top-52 -left-52 w-[820px] h-[820px] rounded-full">
        <motion.div
          animate={reduced ? {} : { opacity: [0.22, 0.32, 0.22], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0.14) 30%, rgba(212,175,55,0.045) 55%, transparent 76%)',
            filter: 'blur(72px)',
          }}
        />
      </motion.div>

      {/* Plano 2 — âmbar inferior direito */}
      <motion.div
        style={{ x: p2x, y: p2y, willChange: 'transform' }}
        className="absolute -bottom-60 -right-60 w-[960px] h-[960px] rounded-full">
        <motion.div
          animate={reduced ? {} : { opacity: [0.1, 0.18, 0.1], scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(184,149,31,0.24) 0%, rgba(184,149,31,0.11) 32%, rgba(184,149,31,0.035) 58%, transparent 78%)',
            filter: 'blur(96px)',
          }}
        />
      </motion.div>

      {/* Plano 3 — halo central sutil (distante, contra-move) */}
      <motion.div
        style={{ x: p3x, y: p3y, willChange: 'transform' }}
        className="absolute top-1/2 left-1/2 w-[1400px] h-[720px]"
        initial={false}>
        <div className="w-full h-full -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 40%, transparent 68%)',
            filter: 'blur(120px)',
          }} />
      </motion.div>

      {/* Plano 4 — vinheta na frente, dá foco ao centro (paradas suaves) */}
      <motion.div
        style={{ x: p4x, y: p4y, willChange: 'transform' }}
        className="absolute inset-[-12%]">
        <div className="w-full h-full"
          style={{ background: 'radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.28) 78%, rgba(0,0,0,0.55) 100%)' }} />
      </motion.div>

      {/* Grão anti-banding — dithering fininho por cima de tudo. soft-light
          mistura sem clarear/escurecer a cena; opacidade baixíssima. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: NOISE,
          backgroundSize: '160px 160px',
          opacity: 0.05,
          mixBlendMode: 'soft-light',
        }}
      />
    </div>
  )
}
