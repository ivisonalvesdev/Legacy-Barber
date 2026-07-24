import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, UserPlus, Menu, X } from 'lucide-react'
import { SnipScissors } from '../ui/SnipScissors'
import type { OpenAuthFn } from '../../types'

interface LandingNavProps {
  onOpenAuth: OpenAuthFn
}

export function LandingNav({ onOpenAuth }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mob, setMob] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMob(false)
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 pt-3 pb-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-4 md:px-5 py-3 wide-zoom"
        style={{
          background: scrolled ? 'rgba(5,5,5,0.92)' : 'rgba(5,5,5,0.5)',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          border: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.45)' : 'none',
          transition: 'all 0.3s ease',
        }}>

        {/* Logo — a tesoura corta ao passar o mouse (classe logo-snip) */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="logo-snip flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <SnipScissors size={15} speed={0.5} hoverOnly />
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>LEGACY</div>
            <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(161,161,170,0.85)', letterSpacing: '0.3em', marginTop: '2px' }}>BARBER</div>
          </div>
        </button>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7">
          {[['Recursos', 'features'], ['Como Funciona', 'how-it-works'], ['Preços', 'pricing']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'rgba(113,113,122,0.86)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D4AF37' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(113,113,122,0.86)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Auth buttons — "Entrar" agora aparece também no mobile (cliente
            antigo quer logar direto, sem abrir o menu nem cair no cadastro). */}
        <div className="flex items-center gap-2 md:gap-2.5">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAuth('login')}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-[13px] md:text-sm font-medium transition-all duration-200"
            style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.86)' }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(212,175,55,0.25)'; b.style.color = '#D4AF37' }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.07)'; b.style.color = 'rgba(161,161,170,0.86)' }}>
            <LogIn size={13} /> Entrar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(120,88,8,0.4), 0 0 40px rgba(212,175,55,0.38)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAuth('register')}
            className="relative flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-[13px] md:text-sm font-semibold text-black whitespace-nowrap overflow-hidden"
            style={{
              background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)',
              letterSpacing: '0.01em',
              // Bevel 3D: brilho no topo + sombra interna embaixo. Dá a sensação
              // de que as letras entram no botão (relevo), não que só passeiam
              // por cima — e o overflow-hidden encaixa o texto na borda arredondada.
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(120,88,8,0.4)',
            }}>
            <UserPlus size={13} className="hidden sm:block" />
            <span className="hidden sm:inline">Começar Grátis</span>
            {/* Mobile: "Cadastrar" (mais curto que a frase completa, cabe sem
                aumentar o botão); emboss sutil reforça o 3D das letras. */}
            <span className="sm:hidden" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}>Cadastrar</span>
          </motion.button>
          <button className="md:hidden" onClick={() => setMob(o => !o)} style={{ color: 'rgba(113,113,122,0.86)' }}>
            {mob ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mob && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="md:hidden max-w-6xl mx-auto mt-2 rounded-2xl px-5 py-4 space-y-1"
            style={{ background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[['Recursos', 'features'], ['Como Funciona', 'how-it-works'], ['Preços', 'pricing']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{ color: 'rgba(161,161,170,0.86)' }}>
                {label}
              </button>
            ))}
            <div className="pt-2 flex gap-2">
              <button onClick={() => { onOpenAuth('login'); setMob(false) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center"
                style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.86)' }}>
                Entrar
              </button>
              <button onClick={() => { onOpenAuth('register'); setMob(false) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black text-center"
                style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)' }}>
                Começar Grátis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
