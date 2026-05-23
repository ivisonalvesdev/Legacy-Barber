import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, Download, Users, DollarSign, Activity } from 'lucide-react'
import { REVENUE_DATA } from '../../data/mock'

// ── Dados mockados para relatórios ─────────────────────────────
const MONTHLY_DATA = [
  { day: 'Jan', value: 18400 },
  { day: 'Fev', value: 21200 },
  { day: 'Mar', value: 19800 },
  { day: 'Abr', value: 24600 },
  { day: 'Mai', value: 28650 },
  { day: 'Jun', value: 0     },
]

const TOP_BARBERS = [
  { name: 'Carlos Motta',      avatar: 'CM', revenue: 9840,  clients: 82, avg: 120, rating: 4.9 },
  { name: 'Diego Alves',       avatar: 'DA', revenue: 7200,  clients: 60, avg: 120, rating: 4.8 },
  { name: 'Vinicius Ferreira', avatar: 'VF', revenue: 11610, clients: 97, avg: 120, rating: 4.9 },
]

const SERVICE_DIST = [
  { name: 'Corte + Barba',       pct: 38, revenue: 'R$ 10.887', color: '#D4AF37'         },
  { name: 'Corte Clássico',      pct: 27, revenue: 'R$ 7.736',  color: 'rgba(212,175,55,0.6)' },
  { name: 'Barba Completa',      pct: 18, revenue: 'R$ 5.157',  color: 'rgba(212,175,55,0.35)'},
  { name: 'Tratamento Capilar',  pct: 11, revenue: 'R$ 3.152',  color: 'rgba(212,175,55,0.2)' },
  { name: 'Sobrancelha + Barba', pct:  6, revenue: 'R$ 1.719',  color: 'rgba(212,175,55,0.12)'},
]

type Period = 'semana' | 'mes'

interface MiniBarChartProps {
  data: { day: string; value: number }[]
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

export function AdminRelatoriosView() {
  const [period, setPeriod] = useState<Period>('semana')
  const chartData = period === 'semana' ? REVENUE_DATA : MONTHLY_DATA

  const totalWeek  = REVENUE_DATA.reduce((a, b) => a + b.value, 0)
  const totalMonth = 28650
  const prevWeek   = 10650
  const prevMonth  = 24100
  const growthWeek  = (((totalWeek  - prevWeek)  / prevWeek)  * 100).toFixed(1)
  const growthMonth = (((totalMonth - prevMonth) / prevMonth) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
            Relatórios
          </h1>
          <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
            Visão geral de desempenho — maio 2025
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.7)' }}>
          <Download size={13} /> Exportar PDF
        </motion.button>
      </div>

      {/* KPIs de comparativo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: DollarSign,  label: 'Faturamento semana',  value: `R$ ${totalWeek.toLocaleString('pt-BR')}`,   growth: growthWeek,  positive: true  },
          { icon: TrendingUp,  label: 'Faturamento mês',     value: `R$ ${totalMonth.toLocaleString('pt-BR')}`,  growth: growthMonth, positive: true  },
          { icon: Users,       label: 'Novos clientes/mês',  value: '14',                                         growth: '16.7',      positive: true  },
          { icon: Activity,    label: 'Ticket médio',         value: 'R$ 92',                                     growth: '-3.2',      positive: false },
        ].map((k, i) => {
          const Icon = k.icon
          const G    = k.positive ? TrendingUp : TrendingDown
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
                <div className={`flex items-center gap-1 text-[10px] font-semibold`}
                  style={{ color: k.positive ? '#4ade80' : '#f87171' }}>
                  <G size={10} />{k.positive ? '+' : ''}{k.growth}%
                </div>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                {k.value}
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
              {period === 'semana' ? `Total: R$ ${totalWeek.toLocaleString('pt-BR')}` : `Total: R$ ${totalMonth.toLocaleString('pt-BR')}`}
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
                {p === 'semana' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
        <MiniBarChart data={chartData} height={140} />
        <div className="flex items-center justify-end gap-1.5 mt-3" style={{ fontSize: '11px', color: '#4ade80' }}>
          <ArrowUpRight size={12} />
          {period === 'semana' ? `+${growthWeek}%` : `+${growthMonth}%`} vs período anterior
        </div>
      </div>

      {/* Top Barbeiros + Distribuição de Serviços */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top barbeiros */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
            Top Barbeiros — Mês
          </h3>
          <div className="space-y-4">
            {TOP_BARBERS.sort((a, b) => b.revenue - a.revenue).map((b, i) => (
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
                  <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)' }}>{b.clients} clientes · ★ {b.rating}</div>
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
          <div className="space-y-3">
            {SERVICE_DIST.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)' }}>{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', fontFamily: 'monospace' }}>{s.revenue}</span>
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
              R$ 28.651
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
