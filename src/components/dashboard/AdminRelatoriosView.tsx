import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download,
  Users, DollarSign, Activity, Wallet, Package, Percent, CalendarCheck,
} from 'lucide-react'
import type { AppUser } from '../../types'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'

interface AdminRelatoriosViewProps {
  user: AppUser
}

type ChartPoint = { day: string; value: number }
type DualPoint  = { label: string; inValue: number; outValue: number }
type TopBarber  = { name: string; avatar: string; avatarUrl: string | null; revenue: number; clients: number }
type SvcDist    = { name: string; pct: number; revenue: number; color: string }
type TopInsumo  = { name: string; qty: number; value: number }

type Period = 'semana' | 'mes'

const iso = (d: Date) => d.toISOString().split('T')[0]
const DAYS_PT   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const money = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`

// O PostgREST corta a resposta em 1000 linhas; 6 meses de histórico passa
// disso numa barbearia movimentada, então busca em páginas até esgotar.
const PAGE_SIZE = 1000

async function fetchAllPages<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const all: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1)
    if (error || !data) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return all
}

type BookingRow = {
  barber_id:     string
  client_id:     string | null
  service_name:  string
  service_price: number | string
  date:          string
}

type MovementRow = {
  product_name: string
  type:         'in' | 'out'
  qty:          number
  unit_cost:    number | string
  created_at:   string
}

const DIST_COLORS = [
  '#D4AF37',
  'rgba(212,175,55,0.6)',
  'rgba(212,175,55,0.35)',
  'rgba(212,175,55,0.2)',
  'rgba(212,175,55,0.12)',
]

// ─── Título de seção — organiza o relatório em blocos nomeados ───
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span style={{
        fontSize: '11px', fontWeight: 700, color: 'rgba(212,175,55,0.75)',
        textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap',
      }}>
        {children}
      </span>
      <div className="flex-1" style={{ height: '1px', background: 'linear-gradient(to right, rgba(212,175,55,0.18), transparent)' }} />
    </div>
  )
}

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
            <span style={{ fontSize: '9px', color: 'rgba(113,113,122,0.64)', fontWeight: 500 }}>{d.day}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Compras × Consumo por mês — duas barras lado a lado ─────────
function DualBarChart({ data, height = 130 }: { data: DualPoint[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.flatMap(d => [d.inValue, d.outValue])) || 1

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => {
        const hIn  = Math.max((d.inValue  / max) * (height - 30), d.inValue  > 0 ? 4 : 0)
        const hOut = Math.max((d.outValue / max) * (height - 30), d.outValue > 0 ? 4 : 0)
        const isHover = hover === i
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {isHover ? (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ↓ {money(d.inValue)} · ↑ {money(d.outValue)}
              </motion.div>
            ) : <div style={{ height: '22px' }} />}
            <div className="w-full flex items-end justify-center gap-1">
              <motion.div initial={{ height: 0 }} animate={{ height: hIn }}
                transition={{ duration: 0.7, delay: i * 0.06 }}
                className="rounded-t-md" style={{
                  width: '42%',
                  background: d.inValue > 0 ? 'linear-gradient(to top, rgba(212,175,55,0.35), rgba(212,175,55,0.7))' : 'rgba(255,255,255,0.04)',
                }} />
              <motion.div initial={{ height: 0 }} animate={{ height: hOut }}
                transition={{ duration: 0.7, delay: i * 0.06 + 0.05 }}
                className="rounded-t-md" style={{
                  width: '42%',
                  background: d.outValue > 0 ? 'rgba(161,161,170,0.46)' : 'rgba(255,255,255,0.04)',
                }} />
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(113,113,122,0.64)', fontWeight: 500 }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// Delta % vs período anterior; null quando não há base de comparação
const delta = (curr: number, prev: number): number | null =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string
  d?: number | null
  /** para gastos, crescer é ruim — inverte a cor do delta */
  invert?: boolean
  loading: boolean
  highlight?: boolean
  index: number
}

function KpiCard({ icon: Icon, label, value, d = null, invert = false, loading, highlight = false, index }: KpiCardProps) {
  const positive = (d ?? 0) >= 0
  const good     = invert ? !positive : positive
  const G        = positive ? TrendingUp : TrendingDown
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-2xl p-4"
      style={{
        background: highlight ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${highlight ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}>
          <Icon size={14} style={{ color: '#D4AF37' }} />
        </div>
        {d !== null && (
          <div className="flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: good ? '#4ade80' : '#f87171' }}>
            <G size={10} />{positive ? '+' : ''}{d}%
          </div>
        )}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', lineHeight: 1 }}>
        {loading ? '—' : value}
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.64)', marginTop: '4px' }}>{label}</div>
    </motion.div>
  )
}

export function AdminRelatoriosView({ user }: AdminRelatoriosViewProps) {
  const [period, setPeriod]         = useState<Period>('semana')
  const [loading, setLoading]       = useState(true)
  const [weekChart, setWeekChart]   = useState<ChartPoint[]>([])
  const [monthChart, setMonthChart] = useState<ChartPoint[]>([])
  const [insumosChart, setInsumos]  = useState<DualPoint[]>([])
  const [topInsumos, setTopInsumos] = useState<TopInsumo[]>([])
  const [totals, setTotals] = useState({
    week: 0, prevWeek: 0,
    month: 0, prevMonth: 0,
    clientsMonth: 0, clientsPrevMonth: 0,
    ticket: 0, prevTicket: 0,
    cutsMonth: 0,
    buyMonth: 0, buyPrevMonth: 0,
    stockValue: 0,
  })
  const [topBarbers, setTopBarbers] = useState<TopBarber[]>([])
  const [svcDist, setSvcDist]       = useState<SvcDist[]>([])

  const now = new Date()
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user.barbershopId) { setLoading(false); return }
    const shopId = user.barbershopId

    const load = async () => {
      // Janela única de 6 meses — tudo é agregado aqui no cliente
      const start6m    = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      const start6mISO = iso(start6m)

      const [bookingRows, movementRows, barbersRes, productsRes] = await Promise.all([
        fetchAllPages<BookingRow>((from, to) =>
          supabase.from('bookings')
            .select('barber_id, client_id, service_name, service_price, date')
            .eq('barbershop_id', shopId)
            .eq('status', 'done')
            .gte('date', start6mISO)
            .order('date')
            .range(from, to)),
        fetchAllPages<MovementRow>((from, to) =>
          supabase.from('stock_movements')
            .select('product_name, type, qty, unit_cost, created_at')
            .eq('barbershop_id', shopId)
            .gte('created_at', start6m.toISOString())
            .order('created_at')
            .range(from, to)),
        supabase.from('profiles')
          .select('id, name, avatar, avatar_url')
          .eq('barbershop_id', shopId)
          .in('role', ['barber', 'admin']),
        supabase.from('products')
          .select('stock, cost')
          .eq('barbershop_id', shopId),
      ])

      const rows = bookingRows.map(b => ({
        barberId: b.barber_id,
        clientId: b.client_id,
        service:  b.service_name,
        price:    Number(b.service_price),
        date:     b.date,
      }))
      const moves = movementRows.map(m => ({
        name:  m.product_name,
        type:  m.type,
        qty:   m.qty,
        value: m.qty * Number(m.unit_cost),
        date:  m.created_at.slice(0, 10),
      }))
      const barberNames = new Map(
        (barbersRes.data ?? []).map(b => [b.id, {
          name:      b.name as string,
          avatar:    (b.avatar || b.name || '—') as string,
          avatarUrl: (b.avatar_url ?? null) as string | null,
        }])
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
      const sum = (list: { price: number }[]) => list.reduce((s, r) => s + r.price, 0)

      const weekRows      = rows.filter(r => inRange(r.date, last7Start, todayStr))
      const prevWeekRows  = rows.filter(r => inRange(r.date, prev7Start, prev7End))
      const monthRows     = rows.filter(r => r.date >= monthStart)
      const prevMonthRows = rows.filter(r => inRange(r.date, prevMonthStart, prevMonthEnd))

      const distinct = (list: typeof rows) =>
        new Set(list.filter(r => r.clientId).map(r => r.clientId)).size

      // Compras de insumos (dinheiro que saiu do caixa) por janela
      const buys          = moves.filter(m => m.type === 'in')
      const buyMonth      = buys.filter(m => m.date >= monthStart).reduce((s, m) => s + m.value, 0)
      const buyPrevMonth  = buys.filter(m => inRange(m.date, prevMonthStart, prevMonthEnd)).reduce((s, m) => s + m.value, 0)

      const stockValue = (productsRes.data ?? []).reduce((s, p) => s + p.stock * Number(p.cost), 0)

      setTotals({
        week:             sum(weekRows),
        prevWeek:         sum(prevWeekRows),
        month:            sum(monthRows),
        prevMonth:        sum(prevMonthRows),
        clientsMonth:     distinct(monthRows),
        clientsPrevMonth: distinct(prevMonthRows),
        ticket:           monthRows.length     > 0 ? Math.round(sum(monthRows)     / monthRows.length)     : 0,
        prevTicket:       prevMonthRows.length > 0 ? Math.round(sum(prevMonthRows) / prevMonthRows.length) : 0,
        cutsMonth:        monthRows.length,
        buyMonth,
        buyPrevMonth,
        stockValue,
      })

      // ── Gráfico semana (últimos 7 dias) ───────────────────────
      const wk: ChartPoint[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const dISO = iso(d)
        wk.push({ day: DAYS_PT[d.getDay()], value: sum(rows.filter(r => r.date === dISO)) })
      }
      setWeekChart(wk)

      // ── Gráficos mensais (6 meses): receita + insumos ─────────
      const mo: ChartPoint[] = []
      const ins: DualPoint[] = []
      for (let i = 5; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const a = iso(mStart), b = iso(mEnd)
        mo.push({ day: MONTHS_PT[mStart.getMonth()], value: sum(rows.filter(r => inRange(r.date, a, b))) })
        ins.push({
          label:    MONTHS_PT[mStart.getMonth()],
          inValue:  moves.filter(m => m.type === 'in'  && inRange(m.date, a, b)).reduce((s, m) => s + m.value, 0),
          outValue: moves.filter(m => m.type === 'out' && inRange(m.date, a, b)).reduce((s, m) => s + m.value, 0),
        })
      }
      setMonthChart(mo)
      setInsumos(ins)

      // ── Top insumos consumidos (mês corrente) ─────────────────
      const byInsumo = new Map<string, { qty: number; value: number }>()
      moves.filter(m => m.type === 'out' && m.date >= monthStart).forEach(m => {
        const cur = byInsumo.get(m.name) ?? { qty: 0, value: 0 }
        byInsumo.set(m.name, { qty: cur.qty + m.qty, value: cur.value + m.value })
      })
      setTopInsumos(
        [...byInsumo.entries()]
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      )

      // ── Top barbeiros (mês corrente) ──────────────────────────
      const byBarber = new Map<string, { revenue: number; clients: number }>()
      monthRows.forEach(r => {
        const cur = byBarber.get(r.barberId) ?? { revenue: 0, clients: 0 }
        byBarber.set(r.barberId, { revenue: cur.revenue + r.price, clients: cur.clients + 1 })
      })
      setTopBarbers(
        [...byBarber.entries()]
          .map(([id, v]) => ({
            name:      barberNames.get(id)?.name      ?? 'Barbeiro',
            avatar:    barberNames.get(id)?.avatar    ?? '—',
            avatarUrl: barberNames.get(id)?.avatarUrl ?? null,
            revenue:   v.revenue,
            clients:   v.clients,
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

  // Lucro estimado = receita − compras de insumos do mês. Não entra aluguel/
  // luz/comissão (o app não conhece) — por isso "estimado".
  const profit     = totals.month - totals.buyMonth
  const prevProfit = totals.prevMonth - totals.buyPrevMonth
  const margin     = totals.month > 0 ? Math.round((profit / totals.month) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px,6vw,38px)', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
            Relatórios
          </h1>
          <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>
            Visão geral de desempenho — {monthLabel}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.86)' }}>
          <Download size={13} /> Exportar / Imprimir
        </motion.button>
      </div>

      {/* ═══ FINANCEIRO DO MÊS ═══ */}
      <SectionTitle>Financeiro do mês</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard index={0} loading={loading} highlight icon={DollarSign}
          label="Receita (atendimentos)" value={money(totals.month)}
          d={delta(totals.month, totals.prevMonth)} />
        <KpiCard index={1} loading={loading} icon={Package}
          label="Compras de insumos" value={money(totals.buyMonth)}
          d={delta(totals.buyMonth, totals.buyPrevMonth)} invert />
        <KpiCard index={2} loading={loading} highlight icon={Wallet}
          label="Lucro estimado" value={money(profit)}
          d={delta(profit, prevProfit)} />
        <KpiCard index={3} loading={loading} icon={Percent}
          label="Margem sobre a receita" value={`${margin}%`} />
      </div>

      {/* ═══ RECEITA ═══ */}
      <SectionTitle>Receita</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard index={0} loading={loading} icon={TrendingUp}
          label="Faturamento na semana" value={money(totals.week)}
          d={delta(totals.week, totals.prevWeek)} />
        <KpiCard index={1} loading={loading} icon={CalendarCheck}
          label="Atendimentos no mês" value={`${totals.cutsMonth}`} />
        <KpiCard index={2} loading={loading} icon={Users}
          label="Clientes no mês" value={`${totals.clientsMonth}`}
          d={delta(totals.clientsMonth, totals.clientsPrevMonth)} />
        <KpiCard index={3} loading={loading} icon={Activity}
          label="Ticket médio" value={money(totals.ticket)}
          d={delta(totals.ticket, totals.prevTicket)} />
      </div>

      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div>
            <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px' }}>Receita por Período</h3>
            <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '12px', marginTop: '2px' }}>
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
                  color:  period === p ? '#D4AF37' : 'rgba(113,113,122,0.82)',
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

      {/* ═══ INSUMOS — ENTRA × SAI ═══ */}
      <SectionTitle>Insumos — o que entra e o que sai</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px' }}>
              Compras × Consumo — 6 meses
            </h3>
            <div className="flex items-center gap-3" style={{ fontSize: '10px', color: 'rgba(113,113,122,0.82)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(212,175,55,0.7)' }} /> Compras
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(161,161,170,0.52)' }} /> Consumo
              </span>
            </div>
          </div>
          {!loading && insumosChart.every(p => p.inValue === 0 && p.outValue === 0) ? (
            <p className="text-center py-8" style={{ color: 'rgba(113,113,122,0.58)', fontSize: '12px' }}>
              Sem movimentações ainda. Reposições e baixas de estoque aparecem aqui.
            </p>
          ) : (
            <DualBarChart data={insumosChart} height={150} />
          )}
          <p style={{ fontSize: '10px', color: 'rgba(113,113,122,0.58)', marginTop: '10px', lineHeight: 1.5 }}>
            Compras = dinheiro gasto repondo estoque · Consumo = custo dos produtos usados nos atendimentos
          </p>
        </div>

        <div className="rounded-2xl p-5 flex flex-col"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
            Insumos mais consumidos — Mês
          </h3>
          {!loading && topInsumos.length === 0 && (
            <p className="text-center py-6" style={{ color: 'rgba(113,113,122,0.58)', fontSize: '12px' }}>
              Nenhuma baixa de insumo registrada este mês.
            </p>
          )}
          <div className="space-y-3 flex-1">
            {topInsumos.map((t, i) => {
              const maxVal = topInsumos[0]?.value || 1
              return (
                <motion.div key={t.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)' }}>{t.name}</span>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.64)' }}>{t.qty} un</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(212,175,55,0.7)', fontFamily: 'monospace' }}>
                        {money(t.value)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(t.value / maxVal) * 100}%` }}
                      transition={{ duration: 0.9, delay: i * 0.1 }}
                      style={{ height: '100%', borderRadius: '9999px', background: 'rgba(161,161,170,0.58)' }} />
                  </div>
                </motion.div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '12px', color: 'rgba(113,113,122,0.68)' }}>Valor parado em estoque hoje</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: '#D4AF37' }}>
              {loading ? '—' : money(totals.stockValue)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ EQUIPE & SERVIÇOS ═══ */}
      <SectionTitle>Equipe &amp; Serviços</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top barbeiros */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
            Top Barbeiros — Mês
          </h3>
          {!loading && topBarbers.length === 0 && (
            <p className="text-center py-4" style={{ color: 'rgba(113,113,122,0.58)', fontSize: '12px' }}>
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
                  style={{ color: i === 0 ? '#D4AF37' : 'rgba(113,113,122,0.52)' }}>
                  #{i + 1}
                </div>
                <Avatar url={b.avatarUrl} fallback={b.avatar} size={36} rounded="xl" highlight />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }} className="truncate">{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.64)' }}>{b.clients} atendimento{b.clients !== 1 ? 's' : ''}</div>
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
            <p className="text-center py-4" style={{ color: 'rgba(113,113,122,0.58)', fontSize: '12px' }}>
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
                    <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.64)', fontFamily: 'monospace' }}>
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
            <span style={{ fontSize: '12px', color: 'rgba(113,113,122,0.68)' }}>Total faturado no mês</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: '#D4AF37' }}>
              R$ {totals.month.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
