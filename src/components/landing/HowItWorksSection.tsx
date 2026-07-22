import { motion } from 'framer-motion'
import { Building2, Users, CheckCircle, Zap } from 'lucide-react'

const STEPS = [
  { n: '01', icon: Building2,   title: 'Cadastre sua barbearia', desc: 'Crie sua conta e configure o perfil da barbearia em menos de 5 minutos.' },
  { n: '02', icon: Users,       title: 'Convide sua equipe',     desc: 'Adicione barbeiros com perfis individuais. Cada um acessa sua própria agenda.' },
  { n: '03', icon: CheckCircle, title: 'Comece a receber',       desc: 'Seus clientes já podem agendar online. Você gerencia tudo em um painel.' },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-[1] py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto wide-zoom">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <Zap size={11} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' }}>COMO FUNCIONA</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: 'white' }}>
            Pronto em 3 passos simples
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px"
            style={{ background: 'linear-gradient(to right, rgba(212,175,55,0.15), rgba(212,175,55,0.35), rgba(212,175,55,0.15))' }} />
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.14 }}
                whileHover={{ y: -4 }}
                className="relative text-center rounded-2xl p-8"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 relative"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Icon size={22} style={{ color: '#D4AF37' }} />
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', fontSize: '9px', fontWeight: 700, color: '#D4AF37', fontFamily: 'monospace' }}>
                    {s.n}
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ color: 'rgba(113,113,122,0.77)', fontSize: '13px', lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
