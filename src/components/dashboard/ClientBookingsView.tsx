import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Scissors, XCircle, Heart } from 'lucide-react'
import type { AppUser, BookingStatus } from '../../types'
import { supabase } from '../../lib/supabase'
import { useRealtimeRefresh } from '../../lib/useRealtimeRefresh'
import { LiveBadge } from '../ui/LiveBadge'

interface ClientBookingsViewProps {
  user: AppUser
}

type Booking = {
  id:       string
  date:     string
  time:     string
  service:  string
  price:    number
  barber:   string
  barberId: string | null
  status:   BookingStatus
}

const STATUS_BADGE: Record<BookingStatus, { label: string; color: string; bg: string; border: string }> = {
  upcoming:  { label: 'Agendado',  color: '#D4AF37',                 bg: 'rgba(212,175,55,0.08)',  border: 'rgba(212,175,55,0.2)'  },
  current:   { label: 'Em curso',  color: '#60a5fa',                 bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
  done:      { label: 'Concluído', color: '#4ade80',                 bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)'  },
  cancelled: { label: 'Cancelado', color: 'rgba(248,113,113,0.85)',  bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.18)'  },
}

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function ClientBookingsView({ user }: ClientBookingsViewProps) {
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading, setLoading]     = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [liked, setLiked]         = useState<Set<string>>(new Set())   // ids de cortes já curtidos
  const [liking, setLiking]       = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [{ data }, { data: likes }] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, date, time, service_name, service_price, status, barber_id, barber:profiles!bookings_barber_id_fkey(name)')
          .eq('client_id', user.id)
          .order('date', { ascending: false })
          .order('time', { ascending: false }),
        supabase.from('booking_likes').select('booking_id').eq('client_id', user.id),
      ])
      type Row = {
        id: string; date: string; time: string; service_name: string
        service_price: number | string; status: string
        barber_id: string | null; barber: { name: string } | null
      }
      if (data) setBookings((data as unknown as Row[]).map(b => ({
        id:       b.id,
        date:     b.date,
        time:     b.time,
        service:  b.service_name,
        price:    Number(b.service_price),
        barber:   b.barber?.name ?? 'Barbeiro',
        barberId: b.barber_id,
        status:   b.status as BookingStatus,
      })))
      setLiked(new Set(((likes ?? []) as { booking_id: string }[]).map(l => l.booking_id)))
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { load() }, [load])

  // Tempo real: se o barbeiro concluir ou cancelar o corte, o status muda aqui
  // na hora (e o botão "Curtir corte" aparece assim que fica concluído).
  const live = useRealtimeRefresh(
    `client-bookings-${user.id}`,
    [{ table: 'bookings', filter: `client_id=eq.${user.id}` }],
    load,
  )

  const like = async (b: Booking) => {
    if (!b.barberId || liked.has(b.id)) return
    setLiking(b.id)
    const { error } = await supabase.from('booking_likes').insert({
      booking_id: b.id,
      barber_id:  b.barberId,
      client_id:  user.id,
    })
    setLiking(null)
    // 23505 = já existe (curtiu em outra aba) — trata como sucesso
    if (!error || error.code === '23505') {
      setLiked(prev => new Set(prev).add(b.id))
    }
  }

  const cancel = async (id: string) => {
    setCancelling(id)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('client_id', user.id)
    setCancelling(null)
    if (!error) setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
  }

  const todayISO  = new Date().toISOString().split('T')[0]
  const upcoming  = bookings.filter(b => (b.status === 'upcoming' || b.status === 'current') && b.date >= todayISO)
  const history   = bookings.filter(b => !upcoming.includes(b))

  const Card = ({ b, idx, cancellable }: { b: Booking; idx: number; cancellable: boolean }) => {
    const badge = STATUS_BADGE[b.status]
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ delay: idx * 0.05 }}
        className="rounded-2xl p-4 flex flex-wrap items-center gap-x-4 gap-y-2.5"
        style={{
          background: 'rgba(255,255,255,0.022)',
          border: '1px solid rgba(255,255,255,0.06)',
          opacity: b.status === 'cancelled' ? 0.55 : 1,
        }}>
        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.16)' }}>
          <Calendar size={13} style={{ color: '#D4AF37' }} />
          <span style={{ fontSize: '9px', color: 'rgba(212,175,55,0.8)', fontWeight: 700, marginTop: '2px' }}>
            {b.date.split('-')[2]}/{b.date.split('-')[1]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '13px' }} className="truncate">{b.service}</div>
          <div className="flex items-center gap-3 mt-1" style={{ fontSize: '11px', color: 'rgba(113,113,122,0.82)' }}>
            <span className="flex items-center gap-1"><Scissors size={10} />{b.barber}</span>
            <span className="flex items-center gap-1"><Clock size={10} />{fmtDate(b.date)} · {b.time}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
            {badge.label}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#D4AF37', fontFamily: 'monospace' }}>R$ {b.price}</span>
        </div>
        {cancellable && b.status === 'upcoming' && (
          <button
            onClick={() => cancel(b.id)}
            disabled={cancelling === b.id}
            title="Cancelar agendamento"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 transition-all"
            style={{ background: 'rgba(239,68,68,0.06)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)', cursor: cancelling === b.id ? 'wait' : 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}>
            <XCircle size={11} /> {cancelling === b.id ? '…' : 'Cancelar'}
          </button>
        )}

        {/* Curtir o corte concluído: cada like eleva a nota do barbeiro */}
        {b.status === 'done' && b.barberId && (
          liked.has(b.id) ? (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0"
              style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.28)' }}>
              <Heart size={11} fill="#D4AF37" style={{ color: '#D4AF37' }} /> Curtido
            </span>
          ) : (
            <button
              onClick={() => like(b)}
              disabled={liking === b.id}
              title={`Curtir o corte de ${b.barber} — ajuda a nota dele`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 transition-all"
              style={{ background: 'rgba(212,175,55,0.06)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)', cursor: liking === b.id ? 'wait' : 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.06)' }}>
              <Heart size={11} /> {liking === b.id ? '…' : 'Curtir corte'}
            </button>
          )
        )}
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
            Meus Agendamentos
          </h1>
          <LiveBadge live={live} />
        </div>
        <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>
          Acompanhe e gerencie seus horários
        </p>
      </div>

      {loading && (
        <p className="text-center py-8" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>Carregando…</p>
      )}

      {!loading && bookings.length === 0 && (
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Calendar size={28} style={{ color: 'rgba(212,175,55,0.3)', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 500 }}>Nenhum agendamento ainda</p>
          <p style={{ color: 'rgba(113,113,122,0.64)', fontSize: '12px', marginTop: '4px' }}>
            Use a aba <strong style={{ color: '#D4AF37' }}>Agendar</strong> para marcar seu primeiro horário.
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(113,113,122,0.64)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Próximos
          </div>
          <div className="space-y-2.5">
            <AnimatePresence>
              {upcoming.map((b, i) => <Card key={b.id} b={b} idx={i} cancellable />)}
            </AnimatePresence>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(113,113,122,0.52)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Histórico
          </div>
          <div className="space-y-2.5">
            {history.map((b, i) => <Card key={b.id} b={b} idx={i} cancellable={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}
