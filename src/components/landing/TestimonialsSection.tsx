import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { TESTIMONIALS_DATA } from '../../data/landing'

export function TestimonialsSection() {
  return (
    <section className="relative z-[1] py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto wide-zoom">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-14">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            O que dizem nossos clientes
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS_DATA.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.25s, box-shadow 0.25s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(212,175,55,0.25)'; el.style.boxShadow = '0 0 40px rgba(212,175,55,0.06)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.boxShadow = 'none' }}>
              <div className="flex mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={13} fill="#D4AF37" style={{ color: '#D4AF37' }} />
                ))}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontSize: '13px' }}>{t.name}</div>
                  <div style={{ color: 'rgba(113,113,122,0.64)', fontSize: '11px', marginTop: '1px' }}>{t.shop}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
