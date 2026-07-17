import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, X, TrendingUp, Clock, Scissors, Copy, CheckCheck } from 'lucide-react'
import type { AppUser } from '../../types'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'

interface AdminEquipeViewProps {
  user: AppUser
}

type TeamMember = {
  id:                string
  name:              string
  specialty:         string
  rating:            number
  avatar:            string
  avatarUrl:         string | null
  active:            boolean
  appointmentsToday: number
  revenueToday:      number
  phone:             string
}

export function AdminEquipeView({ user }: AdminEquipeViewProps) {
  const [team, setTeam]         = useState<TeamMember[]>([])
  const [inviteCode, setCode]   = useState<string>('')
  const [copied, setCopied]     = useState(false)
  const [showInvite, setInvite] = useState(false)
  const [loading, setLoading]   = useState(true)

  const todayISO = new Date().toISOString().split('T')[0]

  // ── Carrega equipe + código de convite ───────────────────────
  useEffect(() => {
    if (!user.barbershopId) { setLoading(false); return }

    const load = async () => {
      const [shopRes, membersRes, bookingsRes] = await Promise.all([
        // Código de convite — via RPC: a coluna é revogada na tabela para não
        // vazar o código de outras barbearias na vitrine pública.
        supabase.rpc('my_invite_code'),

        // Barbeiros desta barbearia
        supabase.from('profiles')
          .select('id, name, specialty, avatar, avatar_url, phone, active')
          .eq('barbershop_id', user.barbershopId!)
          .eq('role', 'barber'),

        // Agendamentos de hoje para calcular stats
        supabase.from('bookings')
          .select('barber_id, service_price, status')
          .eq('barbershop_id', user.barbershopId!)
          .eq('date', todayISO),
      ])

      if (shopRes.data) setCode(shopRes.data as string)

      const members = membersRes.data ?? []
      const bookings = bookingsRes.data ?? []

      const mapped: TeamMember[] = members.map(m => {
        const myBookings = bookings.filter(b => b.barber_id === m.id)
        return {
          id:                m.id,
          name:              m.name,
          specialty:         m.specialty  ?? 'Barbeiro',
          rating:            4.9,
          avatar:            m.avatar || m.name,
          avatarUrl:         m.avatar_url ?? null,
          active:            m.active     ?? true,
          phone:             m.phone      ?? '',
          appointmentsToday: myBookings.length,
          revenueToday:      myBookings
            .filter(b => b.status === 'done')
            .reduce((s, b) => s + Number(b.service_price), 0),
        }
      })

      setTeam(mapped)
      setLoading(false)
    }

    load()
  }, [user.barbershopId, todayISO])

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Persiste no banco — controla se o barbeiro aparece para os clientes
  const toggleActive = async (id: string) => {
    const member = team.find(m => m.id === id)
    if (!member) return
    const { error } = await supabase
      .from('profiles')
      .update({ active: !member.active })
      .eq('id', id)
    if (!error) setTeam(p => p.map(m => m.id === id ? { ...m, active: !m.active } : m))
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
          <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>
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

      {/* Código de convite */}
      {inviteCode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex items-center justify-between gap-4"
          style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
              Código de Convite
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              Compartilhe com seus barbeiros — eles inserem ao se cadastrar.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span style={{
              fontFamily: 'monospace', fontSize: '22px', fontWeight: 700,
              color: '#D4AF37', letterSpacing: '0.2em',
            }}>{inviteCode}</span>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(212,175,55,0.1)', color: copied ? '#4ade80' : '#D4AF37', border: `1px solid ${copied ? 'rgba(74,222,128,0.25)' : 'rgba(212,175,55,0.25)'}` }}>
              {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users,      label: 'Ativos hoje',   value: `${active.length}`,                           color: '#D4AF37' },
          { icon: Clock,      label: 'Atendimentos',  value: `${totalApt}`,                                color: '#60a5fa' },
          { icon: TrendingUp, label: 'Faturado hoje', value: `R$ ${totalRev.toLocaleString('pt-BR')}`,     color: '#4ade80' },
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
                <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.68)', marginTop: '1px' }}>{k.label}</div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Estado vazio */}
      {!loading && team.length === 0 && (
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Scissors size={28} style={{ color: 'rgba(212,175,55,0.3)', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 500 }}>Nenhum barbeiro ainda</p>
          <p style={{ color: 'rgba(113,113,122,0.64)', fontSize: '12px', marginTop: '4px' }}>
            Compartilhe o código <strong style={{ color: '#D4AF37' }}>{inviteCode}</strong> para que eles se cadastrem.
          </p>
        </div>
      )}

      {/* Cards dos barbeiros ativos */}
      {active.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(113,113,122,0.64)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
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
                      <Avatar url={m.avatarUrl} fallback={m.avatar} size={44} rounded="xl" highlight />
                      <div>
                        <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.68)', marginTop: '2px' }}>
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
                      { label: 'Avaliação',     value: `★ ${m.rating}` },
                    ].map((stat, j) => (
                      <div key={j} className="rounded-xl p-2.5 text-center"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>{stat.value}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(113,113,122,0.64)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Inativos */}
      {inactive.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(113,113,122,0.52)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
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
                  <Avatar url={m.avatarUrl} fallback={m.avatar} size={40} rounded="xl" />
                  <div>
                    <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.52)' }}>{m.specialty}</div>
                  </div>
                </div>
                <button onClick={() => toggleActive(m.id)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.64)' }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(74,222,128,0.3)'; b.style.color = '#4ade80'; b.style.background = 'rgba(74,222,128,0.06)'; b.textContent = 'Ativar' }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(113,113,122,0.64)'; b.style.background = 'transparent'; b.textContent = 'Inativo' }}>
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
                <button onClick={() => setInvite(false)} style={{ color: 'rgba(113,113,122,0.64)' }}>
                  <X size={17} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px', lineHeight: 1.6 }}>
                Compartilhe o código abaixo com o barbeiro. Ele insere esse código ao se cadastrar no app.
              </p>

              {inviteCode && (
                <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-4"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.22)' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.25em' }}>
                    {inviteCode}
                  </span>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={copyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(212,175,55,0.1)', color: copied ? '#4ade80' : '#D4AF37' }}>
                    {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </motion.button>
                </div>
              )}

              <button onClick={() => setInvite(false)}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.86)' }}>
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
