import { useState, useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import frameDesktop from '../../assets/legacy-barber-frame-01.webp'
import frameMobile  from '../../assets/legacy-barber-frame-9x16.webp'
import videoWebm    from '../../assets/Animacao-Background.webm'
import videoMp4     from '../../assets/animacao-background.mp4'

/**
 * Fundo fixo da marca — favo de mel dourado. Fica preso à viewport e a página
 * inteira rola por cima.
 *
 *  • Desktop (≥640px, sem "movimento reduzido"): VÍDEO em loop (o frame estático
 *    é o poster enquanto carrega). Duas fontes: WebM (menor, Chrome/Firefox/Edge)
 *    e MP4 (fallback do Safari) — o navegador baixa só a que sabe tocar.
 *  • Mobile: frame estático WebP leve (o vídeo nem é carregado).
 *  • prefers-reduced-motion no desktop: cai para o frame estático.
 */
export function SiteBackground() {
  const reduced = useReducedMotion()
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches,
  )
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const showVideo = isDesktop && !reduced

  // Garante autoplay mudo mesmo em navegadores chatos (Safari) — muted + play().
  useEffect(() => {
    if (!showVideo) return
    const v = videoRef.current
    if (v) { v.muted = true; v.play().catch(() => {}) }
  }, [showVideo])

  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, background: '#050505' }}>
      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0"
          autoPlay muted loop playsInline preload="auto"
          poster={frameDesktop}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
          <source src={videoWebm} type="video/webm" />
          <source src={videoMp4}  type="video/mp4" />
        </video>
      ) : (
        <div className="absolute inset-0"
          style={{
            backgroundImage: `url(${isDesktop ? frameDesktop : frameMobile})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
      )}

      {/* Véu sutil no topo e na base — mantém a leitura confortável sobre os
          cantos iluminados sem apagar o brilho do favo. */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(5,5,5,0.45) 0%, rgba(5,5,5,0.12) 22%, rgba(5,5,5,0.12) 74%, rgba(5,5,5,0.5) 100%)' }} />
    </div>
  )
}
