import { motion } from 'framer-motion'
import { TechGrid } from '../ui/TechGrid'
import { AnimatedNumber } from '../ui/AnimatedNumber'

const STATS = [
  { value: 1200, suffix: '+',  label: 'Barbearias Ativas',     prefix: ''    },
  { value: 50,   suffix: 'k+', label: 'Agendamentos/mês',      prefix: ''    },
  { value: 2,    suffix: 'M+', label: 'Gerenciados',           prefix: 'R$ ' },
  { value: 98,   suffix: '%',  label: 'Clientes Satisfeitos',  prefix: ''    },
]

export function StatsSection() {
  return (
    <section
      className="relative z-[1] py-16 px-4 md:px-8 overflow-hidden"
      style={{ background: 'rgba(212,175,55,0.025)', borderTop: '1px solid rgba(212,175,55,0.08)', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
      <TechGrid />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>
                {s.prefix}<AnimatedNumber value={s.value} />{s.suffix}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(113,113,122,0.82)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
