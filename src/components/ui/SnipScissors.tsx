import type { CSSProperties } from 'react'

interface SnipScissorsProps {
  size?:        number
  color?:       string
  strokeWidth?: number
  /** Duração de um ciclo de corte, em segundos */
  speed?:       number
  delay?:       number
}

/**
 * Tesoura que corta de verdade: mesma geometria do ícone do lucide, mas
 * separada nas duas metades — cada uma gira em torno do parafuso (12,12)
 * em sentidos opostos (keyframes .snip-a/.snip-b no index.css).
 */
export function SnipScissors({ size = 22, color = '#D4AF37', strokeWidth = 2, speed = 1.8, delay = 0 }: SnipScissorsProps) {
  const style = { '--snip-dur': `${speed}s`, '--snip-delay': `${delay}s` } as CSSProperties

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {/* metade A: cabo superior-esquerdo + lâmina para baixo-direita */}
      <g className="snip-a">
        <circle cx="6" cy="6" r="3" />
        <path d="M8.12 8.12 20 20" />
      </g>
      {/* metade B: cabo inferior-esquerdo + lâmina para cima-direita */}
      <g className="snip-b">
        <circle cx="6" cy="18" r="3" />
        <path d="M8.12 15.88 20 4" />
      </g>
      {/* parafuso central */}
      <circle cx="12" cy="12" r="0.9" fill={color} stroke="none" />
    </svg>
  )
}
