import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { LANDING_FEATURES } from '../../data/landing'

export function FeaturesSection() {
  return (
    <section id="features" className="relative z-[1] py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <Shield size={11} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' }}>RECURSOS</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
            Tudo que sua barbearia precisa
          </h2>
          <p style={{ color: 'rgba(113,113,122,0.82)', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
            Do agendamento ao financeiro, uma plataforma completa para barbearias profissionais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANDING_FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.08 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative rounded-2xl p-6 cursor-default"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.25s, box-shadow 0.25s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(212,175,55,0.3)'; el.style.boxShadow = '0 0 40px rgba(212,175,55,0.08)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.boxShadow = 'none' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.16)', transition: 'background 0.25s, box-shadow 0.25s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(212,175,55,0.16)'; el.style.boxShadow = '0 0 20px rgba(212,175,55,0.2)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(212,175,55,0.08)'; el.style.boxShadow = 'none' }}>
                  <Icon size={18} style={{ color: '#D4AF37' }} />
                </div>
                <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '15px', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: 'rgba(113,113,122,0.77)', fontSize: '13px', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
