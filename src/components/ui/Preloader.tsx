import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Scissors } from 'lucide-react'

// Círculo de progresso em volta da tesoura + contagem de 0 a 100%.
// A contagem sobe suavemente até 100% (ideal para o splash de carregamento).
export function Preloader() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 2000 // ms para chegar a 100%
    let raf = 0

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // easing suave (easeOut) para desacelerar perto de 100%
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(Math.round(eased * 100))
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const size = 132
  const stroke = 3
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - progress / 100)

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Anel de progresso */}
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#D4AF37" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>

        {/* Tesoura girando no centro */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
            <Scissors size={30} style={{ color: '#D4AF37' }} />
          </motion.div>
        </div>
      </div>

      {/* Contagem */}
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.02em' }}>
        {progress}%
      </div>
    </div>
  )
}
