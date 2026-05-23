import { motion } from 'framer-motion'
import { Scissors } from 'lucide-react'
import { TiltCard } from '../ui/TiltCard'
import { MiniChart } from './MiniChart'

export function DashboardMockup() {
  return (
    <TiltCard className="rounded-2xl overflow-hidden relative" style={{
      background: 'rgba(7,7,7,0.93)',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 0 80px rgba(212,175,55,0.07)',
    }}>
      {/* Chrome bar */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.012)' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            {['rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)', 'rgba(34,197,94,0.7)'].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Scissors size={9} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.6)', fontFamily: "'DM Sans',sans-serif" }}>
              Legacy Barber — Dashboard
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Faturamento', value: 'R$ 1.240', gold: true  },
            { label: 'Clientes',    value: '8 hoje',   gold: false },
            { label: 'Ocupação',    value: '78%',      gold: false },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="rounded-xl p-2.5"
              style={{
                background: s.gold ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${s.gold ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)'}`,
              }}>
              <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: s.gold ? '#D4AF37' : 'rgba(255,255,255,0.85)' }}>
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '9px', color: 'rgba(113,113,122,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Receita Semanal
            </span>
            <span style={{ fontSize: '9px', color: '#4ade80', fontWeight: 600 }}>↑ +24%</span>
          </div>
          <MiniChart />
        </div>

        {/* Schedule */}
        <div>
          <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
            Próximos Agendamentos
          </div>
          <div className="space-y-1.5">
            {[
              { time: '14:00', name: 'Pedro A.',   service: 'Corte + Barba',  now: true  },
              { time: '14:45', name: 'Rodrigo N.', service: 'Corte Clássico', now: false },
              { time: '15:30', name: 'Felipe S.',  service: 'Barba Completa', now: false },
            ].map((a, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.08 }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2"
                style={{
                  background: a.now ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${a.now ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)'}`,
                }}>
                <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: a.now ? '#D4AF37' : 'rgba(113,113,122,0.5)', minWidth: '30px' }}>
                  {a.time}
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{a.name}</div>
                  <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.5)' }}>{a.service}</div>
                </div>
                {a.now && (
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#D4AF37' }} />
                    <span style={{ fontSize: '8px', color: '#D4AF37', fontWeight: 600 }}>Agora</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(7,7,7,0.8), transparent)' }} />
    </TiltCard>
  )
}
