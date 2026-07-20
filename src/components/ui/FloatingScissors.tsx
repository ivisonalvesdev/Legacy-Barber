import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SnipScissors } from './SnipScissors'

type Cross = {
  top:   string   // altura na tela (%)
  size:  number   // px do ícone
  dur:   number   // duração da travessia (s)
  delay: number   // atraso inicial (s)
  dir:   1 | -1   // 1 = esquerda→direita, -1 = direita→esquerda
  snip:  number   // duração de um ciclo de corte (s) — rápido
  op:    number   // opacidade
}

// Geração aleatória e estável (por mount): cada tesoura atravessa a tela numa
// altura, direção, tamanho e velocidade próprios. Direções misturadas de
// propósito — algumas cortam o ar indo, outras voltando.
function makeCrossings(count: number): Cross[] {
  const rand = (a: number, b: number) => a + Math.random() * (b - a)
  return Array.from({ length: count }, (_, i) => ({
    top:   `${rand(4, 92).toFixed(1)}%`,
    size:  Math.round(rand(17, 34)),     // maiores
    dur:   rand(13, 22),                 // travessia suave, nem lenta nem rápida
    delay: rand(0, 14),                  // espalha o início ao longo do tempo
    dir:   (i % 2 === 0 ? 1 : -1) as 1 | -1,
    snip:  rand(0.5, 0.9),               // CORTE RÁPIDO
    op:    rand(0.28, 0.5),              // mais vívidas (antes 0.16–0.3)
  }))
}

/** Uma tesoura que atravessa a tela cortando o ar. */
function Crossing({ c }: { c: Cross }) {
  // Sai da borda (fora da tela) e chega na borda oposta (fora da tela também),
  // usando vw para cobrir a largura inteira independentemente do container.
  const from = c.dir === 1 ? '-12vw' : '112vw'
  const to   = c.dir === 1 ? '112vw' : '-12vw'
  // Tesoura "aponta" na direção do movimento (espelha quando vai para a esquerda).
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
        filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.6))',   // brilho dourado mais forte
        willChange: 'transform',
      }}>
      <SnipScissors size={c.size} speed={c.snip} delay={c.delay} />
    </motion.div>
  )
}

/**
 * Tesouras douradas atravessando a tela suavemente — da esquerda para a
 * direita e da direita para a esquerda, aleatórias — cortando o ar enquanto
 * passam. Sem efeito magnético nem flutuação: só a travessia e o corte.
 * pointer-events off — nunca atrapalham cliques.
 *
 * `variant` só define quantas tesouras a seção recebe (densidade).
 */
export function FloatingScissors({ variant = 'hero' }: { variant?: 'hero' | 'features' | 'cta' }) {
  const reduced = useReducedMotion()
  const count = variant === 'hero' ? 7 : variant === 'features' ? 5 : 5
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const crossings = useMemo(() => makeCrossings(count), [count])

  if (reduced) return null

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {crossings.map((c, i) => <Crossing key={i} c={c} />)}
    </div>
  )
}
