import { motion } from 'framer-motion'
import { Star, Check } from 'lucide-react'
import { PRICING_DATA } from '../../data/landing'
import type { OpenAuthFn } from '../../types'

interface PricingSectionProps {
  onOpenAuth: OpenAuthFn
}

export function PricingSection({ onOpenAuth }: PricingSectionProps) {
  return (
    <section id="pricing" className="relative z-[1] py-24 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <Star size={11} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' }}>PREÇOS</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
            Simples e transparente
          </h2>
          <p style={{ color: 'rgba(113,113,122,0.82)', fontSize: '15px' }}>Sem taxas ocultas. Cancele quando quiser.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 items-center">
          {PRICING_DATA.map((plan, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.1 }}
              whileHover={{ y: plan.recommended ? -6 : -4, scale: plan.recommended ? 1.02 : 1.01 }}
              className={`relative rounded-2xl p-7 ${plan.recommended ? 'md:-my-4' : ''}`}
              style={{
                background: plan.recommended ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.022)',
                border: `1px solid ${plan.recommended ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: plan.recommended ? '0 0 60px rgba(212,175,55,0.12)' : 'none',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => { if (!plan.recommended) { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(212,175,55,0.2)'; el.style.boxShadow = '0 0 30px rgba(212,175,55,0.06)' }}}
              onMouseLeave={e => { if (!plan.recommended) { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.boxShadow = 'none' }}}>
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-black"
                  style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  MAIS POPULAR
                </div>
              )}
              <div style={{ fontSize: '12px', fontWeight: 700, color: plan.recommended ? '#D4AF37' : 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
                {plan.name}
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '42px', fontWeight: 700, color: plan.recommended ? '#D4AF37' : 'white', lineHeight: 1 }}>
                  {plan.price}
                </span>
                {plan.period && <span style={{ fontSize: '14px', color: 'rgba(113,113,122,0.82)' }}>{plan.period}</span>}
              </div>
              <div className="space-y-3 mb-7">
                {plan.features.map((feat, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: plan.recommended ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)' }}>
                      <Check size={9} style={{ color: plan.recommended ? '#D4AF37' : 'rgba(161,161,170,0.86)' }} />
                    </div>
                    <span style={{ fontSize: '13px', color: plan.recommended ? 'rgba(255,255,255,0.8)' : 'rgba(161,161,170,0.77)' }}>{feat}</span>
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: plan.recommended ? '0 0 40px rgba(212,175,55,0.4)' : undefined }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={plan.recommended
                  ? { background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', color: '#000', letterSpacing: '0.02em' }
                  : { border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(161,161,170,0.84)', background: 'transparent', transition: 'border-color 0.2s, color 0.2s' }}
                onMouseEnter={e => { if (!plan.recommended) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(212,175,55,0.3)'; b.style.color = '#D4AF37' }}}
                onMouseLeave={e => { if (!plan.recommended) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.09)'; b.style.color = 'rgba(161,161,170,0.84)' }}}>
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
