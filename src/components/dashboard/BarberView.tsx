import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { AppUser } from '../../types'
import { INVENTORY, AGENDA_HOJE } from '../../data/mock'
import { TiltCard } from '../ui/TiltCard'

interface BarberViewProps {
  user: AppUser
}

export function BarberView({ user }: BarberViewProps) {
  const [inv, setInv] = useState(INVENTORY)
  const use1 = (id: number) => setInv(p => p.map(i => i.id === id ? { ...i, stock: Math.max(0, i.stock - 1) } : i))

  const today    = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
          {greeting}, {user.name.split(' ')[0]}
        </h1>
        <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
          {today.charAt(0).toUpperCase() + today.slice(1)}
          {user.specialty && <span style={{ color: 'rgba(212,175,55,0.5)', marginLeft: '8px' }}>· {user.specialty}</span>}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <TiltCard className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Atendimentos</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>6</div>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '2px' }}>hoje</div>
          </TiltCard>
          <TiltCard className="rounded-xl p-4"
            style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', boxShadow: '0 0 30px rgba(212,175,55,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Faturamento</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#D4AF37' }}>R$ 520</div>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '2px' }}>hoje</div>
          </TiltCard>
        </div>
      </div>

      {/* Agenda */}
      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
          Agenda de Hoje
        </h2>
        <div className="space-y-2 relative">
          <div className="absolute left-[21px] top-3 bottom-3 w-px"
            style={{ background: 'linear-gradient(to bottom, rgba(212,175,55,0.14), rgba(255,255,255,0.03))' }} />
          {AGENDA_HOJE.map((slot, idx) => (
            <motion.div key={idx}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              className="flex items-center gap-3 relative"
              style={{ opacity: slot.status === 'done' ? 0.42 : 1 }}>
              <div className="w-11 flex justify-center flex-shrink-0 relative z-10">
                {slot.status === 'current' ? (
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="absolute w-3.5 h-3.5 rounded-full"
                      style={{ background: '#D4AF37' }} />
                    <div className="w-3.5 h-3.5 rounded-full"
                      style={{ background: '#D4AF37', boxShadow: '0 0 14px rgba(212,175,55,0.85)', position: 'relative' }} />
                  </div>
                ) : slot.status === 'done' ? (
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.4)' }}>
                    <Check size={8} style={{ color: '#4ade80' }} />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                )}
              </div>
              <div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: slot.status === 'current' ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.022)',
                  border: `1px solid ${slot.status === 'current' ? 'rgba(212,175,55,0.22)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                <span className="font-mono text-xs font-bold flex-shrink-0"
                  style={{ color: slot.status === 'current' ? '#D4AF37' : 'rgba(113,113,122,0.55)', minWidth: '40px' }}>
                  {slot.time}
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontSize: '13px' }} className="truncate">{slot.client}</div>
                  <div style={{ color: 'rgba(113,113,122,0.6)', fontSize: '12px' }} className="truncate">{slot.service}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: slot.status === 'current' ? 'rgba(212,175,55,0.12)' : slot.status === 'done' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                    color: slot.status === 'current' ? '#D4AF37' : slot.status === 'done' ? '#4ade80' : 'rgba(113,113,122,0.65)',
                    border: `1px solid ${slot.status === 'current' ? 'rgba(212,175,55,0.22)' : slot.status === 'done' ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {slot.status === 'done' ? 'Concluído' : slot.status === 'current' ? 'Em andamento' : 'Próximo'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Insumos */}
      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
          Baixa Rápida de Insumo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {inv.map((item, idx) => {
            const pct = (item.stock / item.max) * 100
            const barColor = pct <= 25 ? '#ef4444' : pct <= 50 ? '#f59e0b' : '#D4AF37'
            return (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '10px', color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{item.category}</div>
                <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontSize: '13px', marginBottom: '10px', lineHeight: 1.3 }}>{item.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span style={{ fontSize: '20px', fontWeight: 700, color: pct <= 25 ? '#f87171' : '#D4AF37' }}>{item.stock}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)' }}>/ {item.max} {item.unit}</span>
                </div>
                <div className="rounded-full overflow-hidden mb-3" style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: '9999px', background: barColor }} />
                </div>
                <button onClick={() => use1(item.id)}
                  className="w-full py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(113,113,122,0.65)' }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(239,68,68,0.42)'; b.style.color = '#f87171'; b.style.background = 'rgba(239,68,68,0.06)' }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.07)'; b.style.color = 'rgba(113,113,122,0.65)'; b.style.background = 'transparent' }}>
                  Usar 1 unidade
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
