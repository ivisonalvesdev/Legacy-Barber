import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { AppUser } from '../../types'
import { supabase } from '../../lib/supabase'
import { TiltCard } from '../ui/TiltCard'

interface BarberViewProps {
  user: AppUser
}

type AgendaItem = {
  id:      string
  time:    string
  client:  string
  service: string
  price:   number
  status:  'done' | 'current' | 'upcoming'
}

export function BarberView({ user }: BarberViewProps) {
  const [agenda, setAgenda] = useState<AgendaItem[]>([])
  const [stats,  setStats]  = useState({ count: 0, revenue: 0 })

  const today    = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => {
    const todayISO = new Date().toISOString().split('T')[0]
    supabase
      .from('bookings')
      .select('id, time, service_name, service_price, status, client_name, client:profiles!bookings_client_id_fkey(name)')
      .eq('barber_id', user.id)
      .eq('date', todayISO)
      .neq('status', 'cancelled')
      .order('time')
      .then(({ data }) => {
        if (!data) return
        type Row = {
          id: string; time: string; service_name: string; service_price: number | string
          status: string; client_name: string | null; client: { name: string } | null
        }
        const items: AgendaItem[] = (data as unknown as Row[]).map(b => ({
          id:      b.id,
          time:    b.time,
          client:  b.client?.name ?? b.client_name ?? 'Cliente',
          service: b.service_name,
          price:   Number(b.service_price),
          status:  b.status as AgendaItem['status'],
        }))
        setAgenda(items)
        setStats({
          count:   items.length,
          revenue: items
            .filter(a => a.status === 'done')
            .reduce((s, a) => s + a.price, 0),
        })
      })
  }, [user.id])

  const markDone = async (item: AgendaItem) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'done' })
      .eq('id', item.id)
    if (error) return
    setAgenda(prev => prev.map(a => a.id === item.id ? { ...a, status: 'done' } : a))
    setStats(prev => ({ ...prev, revenue: prev.revenue + item.price }))
  }

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
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>{stats.count || '—'}</div>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '2px' }}>hoje</div>
          </TiltCard>
          <TiltCard className="rounded-xl p-4"
            style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', boxShadow: '0 0 30px rgba(212,175,55,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Faturamento</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#D4AF37' }}>R$ {stats.revenue || '—'}</div>
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
          {agenda.length === 0 && (
            <p className="text-center py-6 pl-8" style={{ color: 'rgba(113,113,122,0.5)', fontSize: '13px' }}>
              Nenhum agendamento para hoje.
            </p>
          )}
          {agenda.map((slot, idx) => (
            <motion.div key={slot.id}
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
                {slot.status === 'done' ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.18)' }}>
                    Concluído
                  </span>
                ) : (
                  <button
                    onClick={() => markDone(slot)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0 transition-all duration-150"
                    style={{ background: 'rgba(34,197,94,0.07)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.15)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.07)' }}>
                    <Check size={10} /> Concluir
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
