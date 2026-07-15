import { useState } from 'react'

interface AvatarProps {
  /** URL da foto; ausente → cai nas iniciais. */
  url?:   string | null
  /** Iniciais já prontas ("IA") ou o nome completo, de onde elas são extraídas. */
  fallback: string
  size?:  number
  /** Arredondamento: círculo para pessoa, quadrado suave para barbearia. */
  rounded?: 'full' | 'xl' | '2xl'
  /** Realce dourado quando o item está selecionado. */
  highlight?: boolean
  className?: string
}

const initialsOf = (s: string) => {
  const t = s.trim()
  if (!t) return '—'
  // Já veio como iniciais ("IA"); só normaliza a caixa.
  if (t.length <= 2 && !t.includes(' ')) return t.toUpperCase()
  return t.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const RADIUS = { full: '9999px', xl: '12px', '2xl': '16px' }

export function Avatar({
  url, fallback, size = 48, rounded = 'xl', highlight = false, className = '',
}: AvatarProps) {
  // Foto apagada do Storage não deve deixar um ícone quebrado na tela.
  const [broken, setBroken] = useState(false)
  const showImage = !!url && !broken

  const base = {
    width: size, height: size,
    borderRadius: RADIUS[rounded],
    flexShrink: 0,
    border: `1px solid ${highlight ? 'rgba(212,175,55,0.28)' : 'rgba(255,255,255,0.07)'}`,
  } as const

  if (showImage) return (
    <img
      src={url!} alt={fallback} loading="lazy" onError={() => setBroken(true)}
      className={className}
      style={{ ...base, objectFit: 'cover', background: 'rgba(255,255,255,0.04)' }}
    />
  )

  return (
    <div
      className={`flex items-center justify-center font-bold ${className}`}
      style={{
        ...base,
        background: highlight ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
        color:      highlight ? '#D4AF37' : 'rgba(113,113,122,0.8)',
        // Iniciais acompanham o tamanho do avatar
        fontSize:   Math.max(10, Math.round(size * 0.34)),
        letterSpacing: '0.02em',
      }}>
      {initialsOf(fallback)}
    </div>
  )
}
