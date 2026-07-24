import { motion } from 'framer-motion'
import { Scissors, ArrowRight } from 'lucide-react'
import { TechGrid } from '../ui/TechGrid'
import { FloatingScissors } from '../ui/FloatingScissors'
import type { OpenAuthFn } from '../../types'

interface CTASectionProps {
  onOpenAuth: OpenAuthFn
}

export function CTASection({ onOpenAuth }: CTASectionProps) {
  return (
    <section className="relative z-[1] py-16 md:py-28 px-4 md:px-8 overflow-hidden">
      <TechGrid />
      <FloatingScissors variant="cta" />
      <div className="max-w-3xl mx-auto text-center relative z-10 wide-zoom">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 40px rgba(212,175,55,0.1)', '0 0 80px rgba(212,175,55,0.22)', '0 0 40px rgba(212,175,55,0.1)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <Scissors size={26} style={{ color: '#D4AF37' }} />
          </motion.div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px,4.5vw,64px)', fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: '16px' }}>
            Pronto para transformar<br />sua barbearia?
          </h2>
          <p style={{ color: 'rgba(113,113,122,0.77)', fontSize: '15px', marginBottom: '36px' }}>
            Sem cartão de crédito · Setup em 5 minutos · Suporte em português
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 80px rgba(212,175,55,0.5)' }} whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAuth('register')}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-black text-base"
            style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', letterSpacing: '0.02em' }}>
            Começar Gratuitamente <ArrowRight size={17} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
