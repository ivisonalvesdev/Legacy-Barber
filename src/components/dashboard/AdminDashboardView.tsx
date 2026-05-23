import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Users, Activity, ArrowUpRight, Plus, Clock } from 'lucide-react'
import type { AppUser } from '../../types'
import { AGENDA_HOJE } from '../../data/mock'
import { StatCard }     from '../ui/StatCard'
import { RevenueChart } from './RevenueChart'

interface AdminDashboardViewProps { user: AppUser }

const TOP_SERVICES = [
  { name: 'Corte + Barba',       pct: 38, value: 'R$ 4.960' },
  { name: 'Corte Clássico',      pct: 27, value: 'R$ 3.510' },
  { name: 'Barba Completa',      pct: 18, value: 'R$ 2.340' },
  { name: 'Tratamento Capilar',  pct: 17, value: 'R$ 2.210' },
]

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  done:    { label: 'Concluído',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  current: { label: 'Em curso',  color: '#D4AF37', bg: 'rgba(212,175,55,0.1)'  },
  upcoming:{ label: 'Aguardando',color: 'rgba(161,161,170,0.6)', bg: 'rgba(255,255,255,0.04)' },
}

export function AdminDashboardView({ user }: AdminDashboardViewProps) {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
            Dashboard
          </h1>
          <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
            {today.charAt(0).toUpperCase() + today.slice(1)} · {user.barbershopName || 'Legacy Barber'}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>
          <Plus size={13} /> Novo Agendamento
        </motion.button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Faturamento Hoje" numValue={1240}  prefix="R$ " featured />
        <StatCard icon={TrendingUp} label="Faturamento Mês"  numValue={28650} prefix="R$ " />
        <StatCard icon={Users}      label="Clientes Hoje"    numValue={8}     suffix=" atend." />
        <StatCard icon={Activity}   label="Ocupação"         numValue={78}    suffix="%" />
      </div>

      {/* Chart + Top Services */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Revenue Chart — 2/3 */}
        <div className="md:col-span-2 rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px' }}>Receita — Últimos 7 Dias</h3>
              <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '12px', marginTop: '2px' }}>Total: R$ 13.200</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#4ade80' }}>
              <ArrowUpRight size={13} />+24% vs semana anterior
            </div>
          </div>
          <RevenueChart />
        </div>

        {/* Top Services — 1/3 */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>Top Serviços</h3>
          <div className="space-y-4">
            {TOP_SERVICES.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)' }}>{s.name}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.6)', fontFamily: 'monospace' }}>{s.value}</span>
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
          <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: 'rgba(113,113,122,0.55)' }}>
            <Clock size={12} />
            {AGENDA_HOJE.filter(a => a.status === 'done').length} de {AGENDA_HOJE.length} concluídos
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {AGENDA_HOJE.map((item, i) => {
            const s = STATUS_LABELS[item.status]
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < AGENDA_HOJE.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(113,113,122,0.6)', minWidth: '44px' }}>{item.time}</span>
                <div className="flex-1">
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{item.client}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '1px' }}>{item.service}</div>
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
    </div>
  )
}
