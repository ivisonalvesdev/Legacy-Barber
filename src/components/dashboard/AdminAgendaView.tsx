import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Plus, Scissors } from 'lucide-react'
import type { AppUser } from '../../types'
import { supabase } from '../../lib/supabase'
import { TiltCard } from '../ui/TiltCard'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { LiveBadge } from '../ui/LiveBadge'
import { NewBookingModal } from './NewBookingModal'
import { useRealtimeRefresh } from '../../lib/useRealtimeRefresh'

interface AdminAgendaViewProps {
  user: AppUser
}

type AgendaItem = {
  id:      string
  time:    string
  client:  string
  barber:  string
  service: string
  price:   number
  status:  'done' | 'current' | 'upcoming'
}

// Agenda do dono: mesma capacidade do barbeiro (concluir / cancelar), mas
// enxergando os agendamentos de TODA a barbearia — inclusive os que caíram
// para ele como barbeiro. Assim o admin vê o cliente, conclui ou cancela o
// corte sem depender da conta de um barbeiro.
export function AdminAgendaView({ user }: AdminAgendaViewProps) {
  const [agenda, setAgenda] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats]   = useState({ count: 0, revenue: 0 })
  const [cancelTarget, setCancelTarget] = useState<AgendaItem | null>(null)
  const [cancelling, setCancelling]     = useState(false)
  const [showNew, setShowNew]           = useState(false)

  const today    = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const load = useCallback(async () => {
    if (!user.barbershopId) { setLoading(false); return }
    setLoading(true)
    const todayISO = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('bookings')
      .select('id, time, service_name, service_price, status, client_name, client:profiles!bookings_client_id_fkey(name), barber:profiles!bookings_barber_id_fkey(name)')
      .eq('barbershop_id', user.barbershopId)
      .eq('date', todayISO)
      .neq('status', 'cancelled')
      .order('time')

    type Row = {
      id: string; time: string; service_name: string; service_price: number | string
      status: string; client_name: string | null
      client: { name: string } | null; barber: { name: string } | null
    }
    const items: AgendaItem[] = ((data ?? []) as unknown as Row[]).map(b => ({
      id:      b.id,
      time:    b.time,
      client:  b.client?.name ?? b.client_name ?? 'Cliente',
      barber:  b.barber?.name ?? 'Barbeiro',
      service: b.service_name,
      price:   Number(b.service_price),
      status:  b.status as AgendaItem['status'],
    }))
    setAgenda(items)
    setStats({
      count:   items.length,
      revenue: items.filter(a => a.status === 'done').reduce((s, a) => s + a.price, 0),
    })
    setLoading(false)
  }, [user.barbershopId])

  useEffect(() => { load() }, [load])

  // Tempo real: a agenda se atualiza sozinha quando um cliente agenda, um corte
  // é concluído ou cancelado (+ polling de reserva).
  const live = useRealtimeRefresh(
    user.barbershopId ? `admin-agenda-${user.barbershopId}` : null,
    [{ table: 'bookings', filter: `barbershop_id=eq.${user.barbershopId}` }],
    load,
  )

  const markDone = async (item: AgendaItem) => {
    const { error } = await supabase.from('bookings').update({ status: 'done' }).eq('id', item.id)
    if (error) return
    setAgenda(prev => prev.map(a => a.id === item.id ? { ...a, status: 'done' } : a))
    setStats(prev => ({ ...prev, revenue: prev.revenue + item.price }))
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', cancelTarget.id)
    setCancelling(false)
    if (!error) {
      const wasDone = cancelTarget.status === 'done'
      setAgenda(prev => prev.filter(a => a.id !== cancelTarget.id))
      setStats(prev => ({
        count:   Math.max(0, prev.count - 1),
        revenue: wasDone ? prev.revenue - cancelTarget.price : prev.revenue,
      }))
    }
    setCancelTarget(null)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(26px,5.5vw,34px)', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
              {greeting}, {user.name.split(' ')[0]}
            </h1>
            <LiveBadge live={live} />
          </div>
          <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>
            {today.charAt(0).toUpperCase() + today.slice(1)}
            <span style={{ color: 'rgba(212,175,55,0.5)', marginLeft: '8px' }}>· {user.barbershopName || 'Sua barbearia'}</span>
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>
          <Plus size={13} /> Novo Agendamento
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TiltCard className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Atendimentos</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>{stats.count || '—'}</div>
          <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.64)', marginTop: '2px' }}>hoje</div>
        </TiltCard>
        <TiltCard className="rounded-xl p-4"
          style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', boxShadow: '0 0 30px rgba(212,175,55,0.06)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Faturamento</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#D4AF37' }}>R$ {stats.revenue || '—'}</div>
          <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.64)', marginTop: '2px' }}>concluído hoje</div>
        </TiltCard>
      </div>

      {/* Agenda */}
      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
          Agenda de Hoje
        </h2>
        <div className="space-y-2 relative">
          <div className="absolute left-[21px] top-3 bottom-3 w-px"
            style={{ background: 'linear-gradient(to bottom, rgba(212,175,55,0.14), rgba(255,255,255,0.03))' }} />
          {!loading && agenda.length === 0 && (
            <p className="text-center py-6 pl-8" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>
              Nenhum agendamento para hoje.
            </p>
          )}
          {loading && (
            <p className="text-center py-6 pl-8" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>Carregando…</p>
          )}
          {agenda.map((slot, idx) => (
            <motion.div key={slot.id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
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
                  style={{ color: slot.status === 'current' ? '#D4AF37' : 'rgba(113,113,122,0.68)', minWidth: '40px' }}>
                  {slot.time}
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontSize: '13px' }} className="truncate">{slot.client}</div>
                  <div className="flex items-center gap-2 truncate" style={{ color: 'rgba(113,113,122,0.82)', fontSize: '12px' }}>
                    <span className="truncate">{slot.service}</span>
                    <span className="flex items-center gap-1 flex-shrink-0" style={{ color: 'rgba(212,175,55,0.6)' }}>
                      <Scissors size={9} />{slot.barber.split(' ')[0]}
                    </span>
                  </div>
                </div>
                {slot.status === 'done' ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.18)' }}>
                    Concluído
                  </span>
                ) : (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => markDone(slot)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150"
                      style={{ background: 'rgba(34,197,94,0.07)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.15)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.07)' }}>
                      <Check size={10} /> Concluir
                    </button>
                    <button
                      onClick={() => setCancelTarget(slot)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150"
                      style={{ background: 'rgba(239,68,68,0.06)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.14)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)' }}>
                      <X size={10} /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Tem certeza que deseja cancelar?"
        message={cancelTarget
          ? `O horário ${cancelTarget.time} de ${cancelTarget.client} (${cancelTarget.service}) será cancelado. Essa ação não pode ser desfeita.`
          : ''}
        confirmText="Sim, cancelar"
        cancelText="Não"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <NewBookingModal
        user={user}
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={load}
      />
    </div>
  )
}
