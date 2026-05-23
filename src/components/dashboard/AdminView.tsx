import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Users, Activity, Plus, ArrowUpRight } from 'lucide-react'
import type { AppUser } from '../../types'
import { INVENTORY } from '../../data/mock'
import { StatCard }     from '../ui/StatCard'
import { RevenueChart } from './RevenueChart'

interface AdminViewProps {
  user: AppUser
}

export function AdminView({ user }: AdminViewProps) {
  const [inv, setInv] = useState(INVENTORY)
  const use1 = (id: number) => setInv(p => p.map(i => i.id === id ? { ...i, stock: Math.max(0, i.stock - 1) } : i))
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8">
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
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.7)' }}>
          <Plus size={13} />Novo Agendamento
        </motion.button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Faturamento Hoje" numValue={1240}  prefix="R$ " featured />
        <StatCard icon={TrendingUp} label="Faturamento Mês"  numValue={28650} prefix="R$ " />
        <StatCard icon={Users}      label="Clientes Hoje"    numValue={8}     suffix=" atend." />
        <StatCard icon={Activity}   label="Ocupação"         numValue={78}    suffix="%" />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl p-5"
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

      {/* Inventory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white' }}>
            Gestão de Estoque
          </h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', background: 'rgba(212,175,55,0.05)' }}>
            <Plus size={12} /> Adicionar
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Produto', 'Categoria', 'Estoque', 'Nível', 'Custo', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left"
                    style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.map((item, idx) => {
                const pct = (item.stock / item.max) * 100
                const barColor = pct <= 25 ? '#ef4444' : pct <= 50 ? '#f59e0b' : '#D4AF37'
                return (
                  <motion.tr key={item.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.012)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-5 py-3.5" style={{ color: 'rgba(255,255,255,0.88)', fontSize: '13px', fontWeight: 500 }}>{item.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: '10px', fontWeight: 600, background: 'rgba(255,255,255,0.04)', color: 'rgba(161,161,170,0.65)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono" style={{ fontSize: '13px' }}>
                      <span style={{ color: pct <= 25 ? '#f87171' : 'rgba(255,255,255,0.8)' }}>{item.stock}</span>
                      <span style={{ color: 'rgba(113,113,122,0.45)' }}> / {item.max}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="w-20 rounded-full overflow-hidden" style={{ height: '5px', background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, delay: idx * 0.06 }}
                          style={{ height: '100%', borderRadius: '9999px', background: barColor, boxShadow: `0 0 6px ${barColor}66` }} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono" style={{ fontSize: '13px', color: 'rgba(113,113,122,0.55)' }}>R$ {item.cost}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => use1(item.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150"
                        style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.7)' }}
                        onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(239,68,68,0.45)'; b.style.color = '#f87171'; b.style.background = 'rgba(239,68,68,0.06)' }}
                        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(113,113,122,0.7)'; b.style.background = 'transparent' }}>
                        −1
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
