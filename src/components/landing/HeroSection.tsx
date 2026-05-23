import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { AmbientBackground } from '../ui/AmbientBackground'
import { TechGrid } from '../ui/TechGrid'
import { FloatingParticles } from '../ui/FloatingParticles'
import { DashboardMockup } from './DashboardMockup'
import type { OpenAuthFn } from '../../types'

interface HeroSectionProps {
  onOpenAuth: OpenAuthFn
}

export function HeroSection({ onOpenAuth }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 px-4 md:px-8 overflow-hidden">
      <AmbientBackground />
      <TechGrid />
      <FloatingParticles />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7"
              style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }} />
              <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' }}>SISTEMA 2025 · NOVO</span>
            </motion.div>

            <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {[
                { text: 'Gestão de', color: 'white' },
                { text: 'Barbearia', color: 'gold'  },
                { text: 'de Elite.',  color: 'white' },
              ].map((line, i) => (
                <motion.span key={i}
                  style={{
                    display: 'block',
                    fontSize: 'clamp(42px,5.5vw,76px)',
                    fontWeight: 700,
                    lineHeight: 1.05,
                    ...(line.color === 'gold' ? {
                      background: 'linear-gradient(135deg,#9A7D21 0%,#D4AF37 45%,#F0D060 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    } : { color: 'white' }),
                  }}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.12, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}>
                  {line.text}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.52 }}
              className="mt-6 text-base leading-relaxed"
              style={{ color: 'rgba(113,113,122,0.72)', maxWidth: '470px' }}>
              Agendamento inteligente, controle total de equipe e estoque, relatórios em tempo real. Tudo em um sistema feito para barbearias que buscam excelência.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.62 }}
              className="flex flex-wrap gap-3 mt-8">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(212,175,55,0.42)' }} whileTap={{ scale: 0.97 }}
                onClick={() => onOpenAuth('register')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-black text-sm"
                style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', letterSpacing: '0.02em' }}>
                Começar Gratuitamente <ArrowRight size={15} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(161,161,170,0.75)' }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(212,175,55,0.35)'; b.style.color = '#D4AF37' }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(161,161,170,0.75)' }}>
                Ver Recursos
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="flex items-center gap-8 mt-10">
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Confiado por
              </span>
              {[['1.200+', 'Barbearias'], ['50k+', 'Agendamentos'], ['98%', 'Satisfação']].map(([v, l], i) => (
                <div key={i}>
                  <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: '18px', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '2px' }}>{l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:block">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
              <DashboardMockup />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
