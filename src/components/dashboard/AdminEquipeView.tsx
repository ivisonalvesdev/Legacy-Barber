import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, X, Check, TrendingUp, Clock, Scissors } from 'lucide-react'
import { MOCK_USERS } from '../../data/mock'

interface TeamMember {
  id: string
  name: string
  specialty: string
  rating: number
  avatar: string
  active: boolean
  appointmentsToday: number
  revenueToday: number
  phone: string
}

const INITIAL_TEAM: TeamMember[] = MOCK_USERS
  .filter(u => u.role === 'barber')
  .map((u, i) => ({
    id: u.id,
    name: u.name,
    specialty: u.specialty || 'Corte Clássico',
    rating: [4.9, 4.8][i] ?? 4.7,
    avatar: u.avatar,
    active: true,
    appointmentsToday: [6, 5][i] ?? 4,
    revenueToday: [480, 360][i] ?? 300,
    phone: u.phone,
  }))

// Adicionar um barbeiro inativo de exemplo
INITIAL_TEAM.push({
  id: 'demo-3',
  name: 'Vinicius Ferreira',
  specialty: 'Corte Clássico',
  rating: 4.9,
  avatar: 'VF',
  active: false,
  appointmentsToday: 0,
  revenueToday: 0,
  phone: '11999990005',
})

export function AdminEquipeView() {
  const [team, setTeam]         = useState<TeamMember[]>(INITIAL_TEAM)
  const [showInvite, setInvite] = useState(false)
  const [form, setForm]         = useState({ name: '', specialty: '', phone: '' })

  const toggleActive = (id: string) =>
    setTeam(p => p.map(m => m.id === id ? { ...m, active: !m.active } : m))

  const addMember = () => {
    if (!form.name) return
    const member: TeamMember = {
      id: Date.now().toString(),
      name: form.name,
      specialty: form.specialty || 'Corte Clássico',
      rating: 5.0,
      avatar: form.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(),
      active: true,
      appointmentsToday: 0,
      revenueToday: 0,
      phone: form.phone,
    }
    setTeam(p => [member, ...p])
    setForm({ name: '', specialty: '', phone: '' })
    setInvite(false)
  }

  const active   = team.filter(m => m.active)
  const inactive = team.filter(m => !m.active)
  const totalRev = active.reduce((a, b) => a + b.revenueToday, 0)
  const totalApt = active.reduce((a, b) => a + b.appointmentsToday, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
            Equipe
          </h1>
          <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
            {active.length} barbeiro{active.length !== 1 ? 's' : ''} ativo{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setInvite(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37)', color: '#000' }}>
          <Plus size={13} /> Convidar Barbeiro
        </motion.button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users,      label: 'Ativos hoje',     value: `${active.length}`,        color: '#D4AF37' },
          { icon: Clock,      label: 'Atendimentos',    value: `${totalApt}`,             color: '#60a5fa' },
          { icon: TrendingUp, label: 'Faturado hoje',   value: `R$ ${totalRev.toLocaleString('pt-BR')}`, color: '#4ade80' },
        ].map((k, i) => {
          const Icon = k.icon
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${k.color}14`, border: `1px solid ${k.color}28` }}>
                <Icon size={15} style={{ color: k.color }} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'white', fontFamily: "'Cormorant Garamond', serif" }}>{k.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.55)', marginTop: '1px' }}>{k.label}</div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Cards dos barbeiros */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(113,113,122,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Ativos
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence>
            {active.map((m, i) => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold"
                      style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                      {m.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.55)', marginTop: '2px' }}>
                        <Scissors size={9} style={{ display: 'inline', marginRight: '4px' }} />{m.specialty}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(m.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(239,68,68,0.08)'; b.style.borderColor = 'rgba(239,68,68,0.2)'; b.style.color = '#f87171'; b.textContent = 'Desativar' }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(74,222,128,0.08)'; b.style.borderColor = 'rgba(74,222,128,0.2)'; b.style.color = '#4ade80'; b.textContent = 'Ativo' }}>
                    Ativo
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Atendimentos', value: `${m.appointmentsToday}` },
                    { label: 'Faturado hoje', value: `R$ ${m.revenueToday}` },
                    { label: 'Avaliação', value: `★ ${m.rating}` },
                  ].map((stat, j) => (
                    <div key={j} className="rounded-xl p-2.5 text-center"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>{stat.value}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(113,113,122,0.5)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Inativos */}
      {inactive.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(113,113,122,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Inativos
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {inactive.map((m, i) => (
              <motion.div key={m.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', opacity: 0.6 }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(113,113,122,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {m.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.4)' }}>{m.specialty}</div>
                  </div>
                </div>
                <button onClick={() => toggleActive(m.id)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.5)' }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(74,222,128,0.3)'; b.style.color = '#4ade80'; b.style.background = 'rgba(74,222,128,0.06)'; b.textContent = 'Ativar' }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(113,113,122,0.5)'; b.style.background = 'transparent'; b.textContent = 'Inativo' }}>
                  Inativo
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal — Convidar Barbeiro */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setInvite(false)}>
            <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users size={16} style={{ color: '#D4AF37' }} />
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: 'white' }}>
                    Convidar Barbeiro
                  </h3>
                </div>
                <button onClick={() => setInvite(false)} style={{ color: 'rgba(113,113,122,0.5)' }}>
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Nome completo', key: 'name', placeholder: 'Ex: Lucas Ferreira' },
                  { label: 'Especialidade', key: 'specialty', placeholder: 'Ex: Degradê & Barba' },
                  { label: 'Telefone / WhatsApp', key: 'phone', placeholder: '(11) 9 9999-0000' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {f.label}
                    </label>
                    <input
                      value={(form as Record<string, string>)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setInvite(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.7)' }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={addMember}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-black"
                  style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37)' }}>
                  <Check size={14} /> Adicionar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
