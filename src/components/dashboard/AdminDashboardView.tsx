import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Users, Activity, ArrowUpRight, Plus, Clock } from 'lucide-react'
import type { AppUser } from '../../types'
import { StatCard }        from '../ui/StatCard'
import { RevenueChart }    from './RevenueChart'
import { NewBookingModal } from './NewBookingModal'
import { LiveBadge }       from '../ui/LiveBadge'
import { TIME_SLOTS }      from '../../data/defaults'
import { supabase }        from '../../lib/supabase'
import { useRealtimeRefresh } from '../../lib/useRealtimeRefresh'

interface AdminDashboardViewProps { user: AppUser }

type AgendaItem = {
  time:    string
  client:  string
  service: string
  status:  'done' | 'current' | 'upcoming'
}

type ServiceStat = {
  name:  string
  pct:   number
  value: string
}

type RevenuePoint = {
  day:   string
  value: number
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  done:    { label: 'Concluído',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  current: { label: 'Em curso',  color: '#D4AF37', bg: 'rgba(212,175,55,0.1)'  },
  upcoming:{ label: 'Aguardando',color: 'rgba(161,161,170,0.82)', bg: 'rgba(255,255,255,0.04)' },
}

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function AdminDashboardView({ user }: AdminDashboardViewProps) {
  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayISO   = new Date().toISOString().split('T')[0]

  const [kpis, setKpis]             = useState({ revenueToday: 0, revenueMonth: 0, clientsToday: 0, occupation: 0 })
  const [agenda, setAgenda]         = useState<AgendaItem[]>([])
  const [topServices, setTopSvc]    = useState<ServiceStat[]>([])
  const [revenueData, setRevData]   = useState<RevenuePoint[]>([])
  const [weekDelta, setWeekDelta]   = useState<number | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showNew, setShowNew]       = useState(false)

  const load = useCallback(async () => {
      if (!user.barbershopId) { setLoading(false); return }
      try {

      const bsId       = user.barbershopId
      const now        = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      // last 7 days window
      const d7 = new Date(); d7.setDate(d7.getDate() - 6)
      const last7Start = d7.toISOString().split('T')[0]

      // previous 7 days window (for delta %)
      const dp = new Date(); dp.setDate(dp.getDate() - 13)
      const prev7Start = dp.toISOString().split('T')[0]
      const prev7End   = new Date(d7.getTime() - 86400000).toISOString().split('T')[0]

      const [todayRes, monthRes, agendaRes, last7Res, prev7Res, barbersRes] = await Promise.all([
        // KPI hoje (cancelados fora)
        supabase.from('bookings')
          .select('service_price, status')
          .eq('barbershop_id', bsId)
          .eq('date', todayISO)
          .neq('status', 'cancelled'),

        // KPI mês + top services
        supabase.from('bookings')
          .select('service_name, service_price')
          .eq('barbershop_id', bsId)
          .eq('status', 'done')
          .gte('date', monthStart)
          .lte('date', monthEnd),

        // Agenda do dia com nome do cliente (client_name cobre walk-ins)
        supabase.from('bookings')
          .select('time, service_name, status, client_name, client:profiles!bookings_client_id_fkey(name)')
          .eq('barbershop_id', bsId)
          .eq('date', todayISO)
          .neq('status', 'cancelled')
          .order('time'),

        // Últimos 7 dias para o gráfico
        supabase.from('bookings')
          .select('date, service_price')
          .eq('barbershop_id', bsId)
          .eq('status', 'done')
          .gte('date', last7Start)
          .lte('date', todayISO),

        // 7 dias anteriores para calcular delta
        supabase.from('bookings')
          .select('service_price')
          .eq('barbershop_id', bsId)
          .eq('status', 'done')
          .gte('date', prev7Start)
          .lte('date', prev7End),

        // Barbeiros ativos (o dono também atende) — capacidade do dia
        supabase.from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('barbershop_id', bsId)
          .in('role', ['barber', 'admin'])
          .eq('active', true),
      ])

      // ── KPIs ────────────────────────────────────────────────
      const todayRows    = todayRes.data  ?? []
      const monthRows    = monthRes.data  ?? []
      const revenueToday = todayRows.filter(b => b.status === 'done').reduce((s, b) => s + Number(b.service_price), 0)
      const revenueMonth = monthRows.reduce((s, b) => s + Number(b.service_price), 0)
      const clientsToday = todayRows.length
      // Ocupação = agendamentos do dia ÷ capacidade (slots × barbeiros ativos)
      const barberCount  = barbersRes.count ?? 0
      const capacity     = TIME_SLOTS.length * Math.max(barberCount, 1)
      const occupation   = Math.min(100, Math.round((clientsToday / capacity) * 100))

      setKpis({ revenueToday, revenueMonth, clientsToday, occupation })

      // ── Agenda ──────────────────────────────────────────────
      type AgendaRow = {
        time: string; service_name: string; status: string
        client_name: string | null; client: { name: string } | null
      }
      const items: AgendaItem[] = ((agendaRes.data ?? []) as unknown as AgendaRow[]).map(b => ({
        time:    b.time,
        client:  b.client?.name ?? b.client_name ?? 'Cliente',
        service: b.service_name,
        status:  b.status as AgendaItem['status'],
      }))
      setAgenda(items)

      // ── Top Services (por receita no mês) ───────────────────
      const svcMap: Record<string, number> = {}
      monthRows.forEach(b => {
        svcMap[b.service_name] = (svcMap[b.service_name] ?? 0) + Number(b.service_price)
      })
      const totalRev = Object.values(svcMap).reduce((s, v) => s + v, 0) || 1
      const top = Object.entries(svcMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, rev]) => ({
          name,
          pct:   Math.round((rev / totalRev) * 100),
          value: `R$ ${rev.toLocaleString('pt-BR')}`,
        }))
      setTopSvc(top)

      // ── Gráfico — últimos 7 dias ─────────────────────────────
      type PriceRow = { date?: string; service_price: number | string }
      const last7Rows = (last7Res.data ?? []) as PriceRow[]
      const last7Points: RevenuePoint[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const iso = d.toISOString().split('T')[0]
        const val = last7Rows
          .filter(b => b.date === iso)
          .reduce((s, b) => s + Number(b.service_price), 0)
        last7Points.push({ day: DAYS_PT[d.getDay()], value: val })
      }
      setRevData(last7Points)

      // ── Delta semana ─────────────────────────────────────────
      const thisWeekTotal = last7Points.reduce((s, p) => s + p.value, 0)
      const prevWeekTotal = ((prev7Res.data ?? []) as PriceRow[]).reduce((s, b) => s + Number(b.service_price), 0)
      if (prevWeekTotal > 0) {
        setWeekDelta(Math.round(((thisWeekTotal - prevWeekTotal) / prevWeekTotal) * 100))
      }

      } finally {
        setLoading(false)
      }
  }, [todayISO, user.barbershopId])

  useEffect(() => { load() }, [load])

  // Tempo real: recarrega os números a cada mudança em bookings da barbearia
  // (+ polling de reserva). Pensado para uma TV na barbearia.
  const live = useRealtimeRefresh(
    user.barbershopId ? `admin-dash-${user.barbershopId}` : null,
    [{ table: 'bookings', filter: `barbershop_id=eq.${user.barbershopId}` }],
    load,
  )

  const totalChart = revenueData.reduce((s, p) => s + p.value, 0)

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px,6vw,38px)', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
              Dashboard
            </h1>
            <LiveBadge live={live} />
          </div>
          <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>
            {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} · {user.barbershopName || 'Legacy Barber'}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>
          <Plus size={13} /> Novo Agendamento
        </motion.button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Faturamento Hoje" numValue={kpis.revenueToday}  prefix="R$ " featured />
        <StatCard icon={TrendingUp} label="Faturamento Mês"  numValue={kpis.revenueMonth}  prefix="R$ " />
        <StatCard icon={Users}      label="Clientes Hoje"    numValue={kpis.clientsToday}  suffix=" atend." />
        <StatCard icon={Activity}   label="Ocupação"         numValue={kpis.occupation}    suffix="%" />
      </div>

      {/* Chart + Top Services */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Revenue Chart — 2/3 */}
        <div className="md:col-span-2 rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px' }}>Receita — Últimos 7 Dias</h3>
              <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '12px', marginTop: '2px' }}>
                {loading ? '—' : `Total: R$ ${totalChart.toLocaleString('pt-BR')}`}
              </p>
            </div>
            {weekDelta !== null && (
              <div className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: weekDelta >= 0 ? '#4ade80' : '#f87171' }}>
                <ArrowUpRight size={13} style={{ transform: weekDelta < 0 ? 'rotate(90deg)' : undefined }} />
                {weekDelta >= 0 ? '+' : ''}{weekDelta}% vs semana anterior
              </div>
            )}
          </div>
          <RevenueChart data={revenueData} />
        </div>

        {/* Top Services — 1/3 */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>Top Serviços</h3>
          <div className="space-y-4">
            {(topServices.length > 0 ? topServices : [
              { name: 'Corte + Barba',      pct: 38, value: '—' },
              { name: 'Corte Clássico',     pct: 27, value: '—' },
              { name: 'Barba Completa',     pct: 18, value: '—' },
              { name: 'Tratamento Capilar', pct: 17, value: '—' },
            ]).map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)' }}>{s.name}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.82)', fontFamily: 'monospace' }}>{s.value}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 1, delay: i * 0.12 }}
                    style={{ height: '100%', borderRadius: '9999px', background: i === 0 ? '#D4AF37' : 'rgba(212,175,55,0.4)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agenda de Hoje */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white' }}>
            Agenda de Hoje
          </h2>
          <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: 'rgba(113,113,122,0.68)' }}>
            <Clock size={12} />
            {agenda.filter(a => a.status === 'done').length} de {agenda.length} concluídos
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {agenda.length === 0 && !loading && (
            <p className="text-center py-8" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>
              Nenhum agendamento para hoje.
            </p>
          )}
          {agenda.map((item, i) => {
            const s = STATUS_LABELS[item.status] ?? STATUS_LABELS.upcoming
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < agenda.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(113,113,122,0.82)', minWidth: '44px' }}>{item.time}</span>
                <div className="flex-1">
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{item.client}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.64)', marginTop: '1px' }}>{item.service}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ color: s.color, background: s.bg }}>
                  {s.label}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Modal — agendamento manual (walk-in) */}
      <NewBookingModal
        user={user}
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={load}
      />
    </div>
  )
}
