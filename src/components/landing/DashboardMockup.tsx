import { motion } from 'framer-motion'
import { Scissors, Wallet, Users, Gauge, BellRing, ChevronRight } from 'lucide-react'
import { TiltCard } from '../ui/TiltCard'
import { MiniChart } from './MiniChart'

const KPIS = [
  { icon: Wallet, label: 'Faturamento', value: 'R$ 1.240', delta: '+18%', gold: true,  bar: null },
  { icon: Users,  label: 'Clientes',    value: '8 hoje',   delta: '+2',   gold: false, bar: null },
  { icon: Gauge,  label: 'Ocupação',    value: '78%',      delta: null,   gold: false, bar: 78   },
] as const

const AGENDA = [
  { time: '14:00', name: 'Pedro A.',   initials: 'PA', service: 'Corte + Barba',  now: true  },
  { time: '14:45', name: 'Rodrigo N.', initials: 'RN', service: 'Corte Clássico', now: false },
  { time: '15:30', name: 'Felipe S.',  initials: 'FS', service: 'Barba Completa', now: false },
] as const

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
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', fontFamily: "'DM Sans',sans-serif" }}>
              Legacy Barber — Dashboard
            </span>
          </div>
        </div>
        {/* Ao vivo */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)' }}>
          <motion.div
            animate={{ opacity: [1, 0.25, 1], scale: [1, 0.8, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
          <span style={{ fontSize: '8px', fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em' }}>AO VIVO</span>
        </div>
      </div>

      {/* Toast — novo agendamento entrando de tempos em tempos */}
      <motion.div
        initial={{ opacity: 0, x: 70 }}
        animate={{ opacity: [0, 1, 1, 0], x: [70, 0, 0, 70] }}
        transition={{ duration: 4.6, delay: 2.6, times: [0, 0.12, 0.86, 1], repeat: Infinity, repeatDelay: 5.5, ease: 'easeInOut' }}
        className="absolute flex items-center gap-2 px-3 py-2 rounded-xl pointer-events-none"
        style={{
          top: 44, right: 10, zIndex: 5,
          background: 'rgba(10,10,10,0.97)',
          border: '1px solid rgba(212,175,55,0.32)',
          boxShadow: '0 10px 32px rgba(0,0,0,0.55), 0 0 24px rgba(212,175,55,0.1)',
        }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.26)' }}>
          <BellRing size={11} style={{ color: '#D4AF37' }} />
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Novo agendamento</div>
          <div style={{ fontSize: '8px', color: 'rgba(212,175,55,0.85)', marginTop: '1px' }}>16:15 · Lucas M. — Corte + Barba</div>
        </div>
      </motion.div>

      <div className="p-4 space-y-3">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          {KPIS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="rounded-xl p-2.5"
                style={{
                  background: s.gold ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.gold ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                <div className="flex items-center gap-1" style={{ marginBottom: '3px' }}>
                  <Icon size={9} style={{ color: s.gold ? '#D4AF37' : 'rgba(113,113,122,0.72)', flexShrink: 0 }} />
                  <span style={{ fontSize: '8px', color: 'rgba(113,113,122,0.64)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: '13px', fontWeight: 700, color: s.gold ? '#D4AF37' : 'rgba(255,255,255,0.85)' }}>
                    {s.value}
                  </span>
                  {s.delta && (
                    <span style={{ fontSize: '8px', fontWeight: 700, color: '#4ade80' }}>↑ {s.delta}</span>
                  )}
                </div>
                {s.bar !== null && (
                  <div className="rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.06)', marginTop: '4px' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${s.bar}%` }}
                      transition={{ duration: 1.1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #B8951F, #D4AF37)' }} />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Chart */}
        <div className="rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '9px', color: 'rgba(113,113,122,0.64)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Receita Semanal
            </span>
            <span style={{ fontSize: '9px', color: '#4ade80', fontWeight: 600 }}>↑ +24%</span>
          </div>
          <MiniChart />
        </div>

        {/* Schedule */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '8px', color: 'rgba(113,113,122,0.58)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Próximos Agendamentos
            </span>
            <span className="flex items-center" style={{ fontSize: '8px', fontWeight: 600, color: 'rgba(212,175,55,0.7)' }}>
              Ver agenda <ChevronRight size={8} />
            </span>
          </div>
          <div className="space-y-1.5">
            {AGENDA.map((a, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.08 }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2"
                style={{
                  background: a.now ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${a.now ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)'}`,
                }}>
                <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: a.now ? '#D4AF37' : 'rgba(113,113,122,0.64)', minWidth: '30px' }}>
                  {a.time}
                </span>
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    background: a.now ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.045)',
                    border: `1px solid ${a.now ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <span style={{ fontSize: '7px', fontWeight: 700, color: a.now ? '#D4AF37' : 'rgba(161,161,170,0.8)' }}>
                    {a.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{a.name}</div>
                  <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.64)' }}>{a.service}</div>
                </div>
                {a.now ? (
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#D4AF37' }} />
                    <span style={{ fontSize: '8px', color: '#D4AF37', fontWeight: 600 }}>Agora</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '7px', fontWeight: 600, color: 'rgba(74,222,128,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Confirmado
                  </span>
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
