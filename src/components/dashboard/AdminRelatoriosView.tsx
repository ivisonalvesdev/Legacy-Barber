import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Users, DollarSign, Activity } from 'lucide-react'
import type { AppUser } from '../../types'
import { supabase } from '../../lib/supabase'

interface AdminRelatoriosViewProps {
  user: AppUser
}

type ChartPoint = { day: string; value: number }
type TopBarber  = { name: string; avatar: string; revenue: number; clients: number }
type SvcDist    = { name: string; pct: number; revenue: number; color: string }

type Period = 'semana' | 'mes'

const iso = (d: Date) => d.toISOString().split('T')[0]
const DAYS_PT   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const DIST_COLORS = [
  '#D4AF37',
  'rgba(212,175,55,0.6)',
  'rgba(212,175,55,0.35)',
  'rgba(212,175,55,0.2)',
  'rgba(212,175,55,0.12)',
]

interface MiniBarChartProps {
  data: ChartPoint[]
  height?: number
}

function MiniBarChart({ data, height = 110 }: MiniBarChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map(d => d.value)) || 1

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const pct  = d.value / max
        const barH = Math.max(pct * (height - 28), d.value > 0 ? 4 : 0)
        const isHover = hover === i
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}>
            {isHover && d.value > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}>
                R$ {d.value.toLocaleString('pt-BR')}
              </motion.div>
            )}
            {!isHover && <div style={{ height: '22px' }} />}
            <motion.div
              initial={{ height: 0 }} animate={{ height: barH }}
              transition={{ duration: 0.7, delay: i * 0.07 }}
              className="w-full rounded-t-md"
              style={{
                background: d.value > 0
                  ? (isHover ? '#D4AF37' : 'linear-gradient(to top, rgba(212,175,55,0.35), rgba(212,175,55,0.6))')
                  : 'rgba(255,255,255,0.04)',
                boxShadow: isHover && d.value > 0 ? '0 0 12px rgba(212,175,55,0.4)' : 'none',
                transition: 'background 0.15s, box-shadow 0.15s',
              }} />
            <span style={{ fontSize: '9px', color: 'rgba(113,113,122,0.5)', fontWeight: 500 }}>{d.day}</span>
          </div>
        )
      })}
    </div>
  )
}

// Delta % vs período anterior; null quando não há base de comparação
const delta = (curr: number, prev: number): number | null =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null

export function AdminRelatoriosView({ user }: AdminRelatoriosViewProps) {
  const [period, setPeriod]         = useState<Period>('semana')
  const [loading, setLoading]       = useState(true)
  const [weekChart, setWeekChart]   = useState<ChartPoint[]>([])
  const [monthChart, setMonthChart] = useState<ChartPoint[]>([])
  const [totals, setTotals] = useState({
    week: 0, prevWeek: 0,
    month: 0, prevMonth: 0,
    clientsMonth: 0, clientsPrevMonth: 0,
    ticket: 0, prevTicket: 0,
  })
  const [topBarbers, setTopBarbers] = useState<TopBarber[]>([])
  const [svcDist, setSvcDist]       = useState<SvcDist[]>([])

  const now = new Date()
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user.barbershopId) { setLoading(false); return }

    const load = async () => {
      // Janela única de 6 meses — tudo é agregado aqui no cliente
      const start6m = new Date(now.getFullYear(), now.getMonth() - 5, 1)

      const [bookingsRes, barbersRes] = await Promise.all([
        supabase.from('bookings')
          .select('barber_id, client_id, service_name, service_price, date')
          .eq('barbershop_id', user.barbershopId!)
          .eq('status', 'done')
          .gte('date', iso(start6m)),
        supabase.from('profiles')
          .select('id, name, avatar')
          .eq('barbershop_id', user.barbershopId!)
          .eq('role', 'barber'),
      ])

      const rows = (bookingsRes.data ?? []).map(b => ({
        barberId: b.barber_id as string,
        clientId: b.client_id as string | null,
        service:  b.service_name as string,
        price:    Number(b.service_price),
        date:     b.date as string,
      }))
      const barberNames = new Map(
        (barbersRes.data ?? []).map(b => [b.id, { name: b.name as string, avatar: (b.avatar ?? '—') as string }])
      )

      // ── Janelas de tempo ──────────────────────────────────────
      const todayStr    = iso(new Date())
      const d7          = new Date(); d7.setDate(d7.getDate() - 6)
      const last7Start  = iso(d7)
      const dp          = new Date(); dp.setDate(dp.getDate() - 13)
      const prev7Start  = iso(dp)
      const prev7End    = iso(new Date(d7.getTime() - 86400000))

      const monthStart      = iso(new Date(now.getFullYear(), now.getMonth(), 1))
      const prevMonthStart  = iso(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      const prevMonthEnd    = iso(new Date(now.getFullYear(), now.getMonth(), 0))

      const inRange = (d: string, a: string, b: string) => d >= a && d <= b
      const sum = (list: typeof rows) => list.reduce((s, r) => s + r.price, 0)

      const weekRows      = rows.filter(r => inRange(r.date, last7Start, todayStr))
      const prevWeekRows  = rows.filter(r => inRange(r.date, prev7Start, prev7End))
      const monthRows     = rows.filter(r => r.date >= monthStart)
      const prevMonthRows = rows.filter(r => inRange(r.date, prevMonthStart, prevMonthEnd))

      const distinct = (list: typeof rows) =>
        new Set(list.filter(r => r.clientId).map(r => r.clientId)).size

      setTotals({
        week:             sum(weekRows),
        prevWeek:         sum(prevWeekRows),
        month:            sum(monthRows),
        prevMonth:        sum(prevMonthRows),
        clientsMonth:     distinct(monthRows),
        clientsPrevMonth: distinct(prevMonthRows),
        ticket:           monthRows.length     > 0 ? Math.round(sum(monthRows)     / monthRows.length)     : 0,
        prevTicket:       prevMonthRows.length > 0 ? Math.round(sum(prevMonthRows) / prevMonthRows.length) : 0,
      })

      // ── Gráfico semana (últimos 7 dias) ───────────────────────
      const wk: ChartPoint[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const dISO = iso(d)
        wk.push({ day: DAYS_PT[d.getDay()], value: sum(rows.filter(r => r.date === dISO)) })
      }
      setWeekChart(wk)

      // ── Gráfico mês (últimos 6 meses) ─────────────────────────
      const mo: ChartPoint[] = []
      for (let i = 5; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        mo.push({
          day:   MONTHS_PT[mStart.getMonth()],
          value: sum(rows.filter(r => inRange(r.date, iso(mStart), iso(mEnd)))),
        })
      }
      setMonthChart(mo)

      // ── Top barbeiros (mês corrente) ──────────────────────────
      const byBarber = new Map<string, { revenue: number; clients: number }>()
      monthRows.forEach(r => {
        const cur = byBarber.get(r.barberId) ?? { revenue: 0, clients: 0 }
        byBarber.set(r.barberId, { revenue: cur.revenue + r.price, clients: cur.clients + 1 })
      })
      setTopBarbers(
        [...byBarber.entries()]
          .map(([id, v]) => ({
            name:    barberNames.get(id)?.name   ?? 'Barbeiro',
            avatar:  barberNames.get(id)?.avatar ?? '—',
            revenue: v.revenue,
            clients: v.clients,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      )

      // ── Distribuição de serviços (mês corrente) ───────────────
      const bySvc = new Map<string, number>()
      monthRows.forEach(r => bySvc.set(r.service, (bySvc.get(r.service) ?? 0) + r.price))
      const totalSvc = [...bySvc.values()].reduce((s, v) => s + v, 0) || 1
      setSvcDist(
        [...bySvc.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, rev], i) => ({
            name,
            revenue: rev,
            pct:     Math.round((rev / totalSvc) * 100),
            color:   DIST_COLORS[i],
          }))
      )

      setLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.barbershopId])

  const chartData  = period === 'semana' ? weekChart : monthChart
  const chartTotal = period === 'semana' ? totals.week : totals.month
  const chartDelta = period === 'semana' ? delta(totals.week, totals.prevWeek) : delta(totals.month, totals.prevMonth)

  const kpis = [
    { icon: DollarSign, label: 'Faturamento semana', value: `R$ ${totals.week.toLocaleString('pt-BR')}`,  d: delta(totals.week, totals.prevWeek) },
    { icon: TrendingUp, label: 'Faturamento mês',    value: `R$ ${totals.month.toLocaleString('pt-BR')}`, d: delta(totals.month, totals.prevMonth) },
    { icon: Users,      label: 'Clientes no mês',    value: `${totals.clientsMonth}`,                      d: delta(totals.clientsMonth, totals.clientsPrevMonth) },
    { icon: Activity,   label: 'Ticket médio',        value: `R$ ${totals.ticket.toLocaleString('pt-BR')}`, d: delta(totals.ticket, totals.prevTicket) },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
            Relatórios
          </h1>
          <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
            Visão geral de desempenho — {monthLabel}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.7)' }}>
          <Download size={13} /> Exportar / Imprimir
        </motion.button>
      </div>

      {/* KPIs de comparativo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => {
          const Icon     = k.icon
          const positive = (k.d ?? 0) >= 0
          const G        = positive ? TrendingUp : TrendingDown
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}>
                  <Icon size={14} style={{ color: '#D4AF37' }} />
                </div>
                {k.d !== null && (
                  <div className="flex items-center gap-1 text-[10px] font-semibold"
                    style={{ color: positive ? '#4ade80' : '#f87171' }}>
                    <G size={10} />{positive ? '+' : ''}{k.d}%
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                {loading ? '—' : k.value}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '4px' }}>{k.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Gráfico de receita */}
      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px' }}>Receita por Período</h3>
            <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '12px', marginTop: '2px' }}>
              {loading ? '—' : `Total: R$ ${chartTotal.toLocaleString('pt-BR')}`}
            </p>
          </div>
          <div className="flex gap-1">
            {(['semana', 'mes'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                style={{
                  background: period === p ? 'rgba(212,175,55,0.1)' : 'transparent',
                  border: `1px solid ${period === p ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  color:  period === p ? '#D4AF37' : 'rgba(113,113,122,0.6)',
                }}>
                {p === 'semana' ? 'Semana' : '6 Meses'}
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 && <MiniBarChart data={chartData} height={140} />}
        {chartDelta !== null && (
          <div className="flex items-center justify-end gap-1.5 mt-3"
            style={{ fontSize: '11px', color: chartDelta >= 0 ? '#4ade80' : '#f87171' }}>
            {chartDelta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {chartDelta >= 0 ? '+' : ''}{chartDelta}% vs período anterior
          </div>
        )}
      </div>

      {/* Top Barbeiros + Distribuição de Serviços */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top barbeiros */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
            Top Barbeiros — Mês
          </h3>
          {!loading && topBarbers.length === 0 && (
            <p className="text-center py-4" style={{ color: 'rgba(113,113,122,0.45)', fontSize: '12px' }}>
              Nenhum atendimento concluído este mês.
            </p>
          )}
          <div className="space-y-4">
            {topBarbers.map((b, i) => (
              <motion.div key={b.name}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3">
                <div className="text-[11px] font-bold w-4 text-center"
                  style={{ color: i === 0 ? '#D4AF37' : 'rgba(113,113,122,0.4)' }}>
                  #{i + 1}
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.09)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.18)' }}>
                  {b.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }} className="truncate">{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)' }}>{b.clients} atendimento{b.clients !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'monospace', flexShrink: 0 }}>
                  R$ {b.revenue.toLocaleString('pt-BR')}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Distribuição de serviços */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
            Distribuição de Serviços
          </h3>
          {!loading && svcDist.length === 0 && (
            <p className="text-center py-4" style={{ color: 'rgba(113,113,122,0.45)', fontSize: '12px' }}>
              Nenhum atendimento concluído este mês.
            </p>
          )}
          <div className="space-y-3">
            {svcDist.map((s, i) => (
              <motion.div key={s.name}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)' }}>{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', fontFamily: 'monospace' }}>
                      R$ {s.revenue.toLocaleString('pt-BR')}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(212,175,55,0.7)', minWidth: '28px', textAlign: 'right' }}>
                      {s.pct}%
                    </span>
                  </div>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.9, delay: i * 0.1 }}
                    style={{ height: '100%', borderRadius: '9999px', background: s.color }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '12px', color: 'rgba(113,113,122,0.55)' }}>Total faturado no mês</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: '#D4AF37' }}>
              R$ {totals.month.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
