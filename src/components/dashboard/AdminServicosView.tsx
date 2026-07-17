import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, Plus, X, Check, Trash2, Pencil, Star, Clock, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import type { AppUser, Service } from '../../types'
import { supabase } from '../../lib/supabase'

interface AdminServicosViewProps {
  user: AppUser
}

// O preço do agendamento é validado contra este catálogo no banco
// (service_matches). Ou seja: o que o dono define aqui É o preço cobrado.
const EMOJIS = ['✂️', '🧔', '⚡', '👑', '✨', '💈', '🪒', '🧴', '👶', '🎨']

type Form = { name: string; price: string; duration: string; emoji: string; popular: boolean }
const EMPTY_FORM: Form = { name: '', price: '', duration: '30', emoji: '✂️', popular: false }

const labelStyle = {
  fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)',
  textTransform: 'uppercase' as const, letterSpacing: '0.08em',
}
const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.85)',
}

export function AdminServicosView({ user }: AdminServicosViewProps) {
  const [items, setItems]     = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg]   = useState('')
  const [modal, setModal]     = useState<'add' | Service | null>(null)
  const [form, setForm]       = useState<Form>(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [confirmDel, setDel]  = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user.barbershopId) { setLoading(false); return }
    const { data, error } = await supabase
      .from('services')
      .select('id, name, duration_min, price, emoji, popular, active')
      .eq('barbershop_id', user.barbershopId)
      .order('price')
    if (error) {
      setErrMsg('Não foi possível carregar os serviços.')
    } else {
      setItems((data ?? []).map(s => ({
        id: s.id, name: s.name, durationMin: s.duration_min,
        price: Number(s.price), emoji: s.emoji, popular: s.popular, active: s.active,
      })))
    }
    setLoading(false)
  }, [user.barbershopId])

  useEffect(() => { load() }, [load])

  const openAdd  = () => { setForm(EMPTY_FORM); setModal('add') }
  const openEdit = (s: Service) => {
    setForm({
      name: s.name, price: String(s.price),
      duration: String(s.durationMin), emoji: s.emoji, popular: s.popular,
    })
    setModal(s)
  }

  const save = async () => {
    const price    = Number(form.price.replace(',', '.'))
    const duration = parseInt(form.duration, 10)
    if (!form.name.trim() || !(price > 0) || !(duration > 0) || !user.barbershopId) return
    setSaving(true)

    const payload = {
      name:         form.name.trim(),
      price,
      duration_min: duration,
      emoji:        form.emoji,
      popular:      form.popular,
    }

    if (modal === 'add') {
      const { data, error } = await supabase.from('services')
        .insert({ ...payload, barbershop_id: user.barbershopId })
        .select('id, name, duration_min, price, emoji, popular, active')
        .single()
      if (!error && data) {
        setItems(p => [...p, {
          id: data.id, name: data.name, durationMin: data.duration_min,
          price: Number(data.price), emoji: data.emoji, popular: data.popular, active: data.active,
        }].sort((a, b) => a.price - b.price))
      }
    } else if (modal) {
      const { error } = await supabase.from('services').update(payload).eq('id', modal.id)
      if (!error) {
        setItems(p => p.map(s => s.id === modal.id
          ? { ...s, name: payload.name, price, durationMin: duration, emoji: payload.emoji, popular: payload.popular }
          : s
        ).sort((a, b) => a.price - b.price))
      }
    }
    setSaving(false)
    setModal(null)
  }

  // Desativar em vez de excluir preserva o serviço para reativar depois;
  // o agendamento do cliente só lista os ativos.
  const toggleActive = async (s: Service) => {
    const { error } = await supabase.from('services').update({ active: !s.active }).eq('id', s.id)
    if (!error) setItems(p => p.map(i => i.id === s.id ? { ...i, active: !s.active } : i))
  }

  const remove = async (id: string) => {
    if (confirmDel !== id) { setDel(id); setTimeout(() => setDel(c => c === id ? null : c), 3000); return }
    setDel(null)
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (!error) setItems(p => p.filter(i => i.id !== id))
  }

  const active = items.filter(i => i.active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
            Serviços
          </h1>
          <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>
            {items.length} no catálogo · {active} visíveis para o cliente — o preço daqui é o preço cobrado
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37)', color: '#000' }}>
          <Plus size={13} /> Novo Serviço
        </motion.button>
      </div>

      {errMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'rgba(248,113,113,0.9)' }}>{errMsg}</p>
        </div>
      )}

      {!loading && !errMsg && items.length === 0 && (
        <p className="text-center py-10" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>
          Nenhum serviço cadastrado. Adicione o primeiro para começar a receber agendamentos.
        </p>
      )}

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {items.map((s, idx) => (
            <motion.div key={s.id} layout
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${s.popular && s.active ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`,
                opacity: s.active ? 1 : 0.55,
              }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.16)', fontSize: '20px' }}>
                    {s.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{s.name}</span>
                      {s.popular && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)', letterSpacing: '0.06em' }}>
                          <Star size={8} /> POPULAR
                        </span>
                      )}
                      {!s.active && (
                        <span className="px-2 py-0.5 rounded-full"
                          style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: 'rgba(113,113,122,0.86)', letterSpacing: '0.06em' }}>
                          OCULTO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1" style={{ fontSize: '11px', color: 'rgba(113,113,122,0.68)' }}>
                      <Clock size={10} /> {s.durationMin} min
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 700, color: '#D4AF37', flexShrink: 0 }}>
                  R$ {s.price.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button onClick={() => openEdit(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(161,161,170,0.86)' }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(212,175,55,0.35)'; b.style.color = '#D4AF37' }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(161,161,170,0.86)' }}>
                  <Pencil size={11} /> Editar
                </button>
                <button onClick={() => toggleActive(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(161,161,170,0.86)' }}
                  title={s.active ? 'Ocultar do agendamento' : 'Voltar a oferecer'}>
                  {s.active ? <EyeOff size={11} /> : <Eye size={11} />}
                  {s.active ? 'Ocultar' : 'Reativar'}
                </button>
                <div className="flex-1" />
                <button onClick={() => remove(s.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    border: `1px solid ${confirmDel === s.id ? 'rgba(239,68,68,0.4)' : 'transparent'}`,
                    background: confirmDel === s.id ? 'rgba(239,68,68,0.08)' : 'transparent',
                    color: confirmDel === s.id ? '#f87171' : 'rgba(113,113,122,0.52)',
                  }}>
                  <Trash2 size={11} /> {confirmDel === s.id ? 'Confirmar?' : ''}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal add/edit */}
      <AnimatePresence>
        {modal !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Scissors size={16} style={{ color: '#D4AF37' }} />
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: 'white' }}>
                    {modal === 'add' ? 'Novo Serviço' : 'Editar Serviço'}
                  </h3>
                </div>
                <button onClick={() => setModal(null)} style={{ color: 'rgba(113,113,122,0.64)' }}>
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label style={labelStyle}>Nome do serviço</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Corte Degradê"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm" style={inputStyle} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Preço (R$)</label>
                    <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="45,00" inputMode="decimal"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Duração (min)</label>
                    <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                      placeholder="30" inputMode="numeric"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Ícone</label>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {EMOJIS.map(em => (
                      <button key={em} onClick={() => setForm(p => ({ ...p, emoji: em }))}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          fontSize: '16px',
                          background: form.emoji === em ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${form.emoji === em ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        }}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => setForm(p => ({ ...p, popular: !p.popular }))}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: form.popular ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.popular ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <span className="flex items-center gap-2" style={{ fontSize: '13px', color: form.popular ? '#D4AF37' : 'rgba(161,161,170,0.86)' }}>
                    <Star size={13} /> Destacar como “Popular”
                  </span>
                  <div className="w-8 h-4.5 rounded-full relative transition-all"
                    style={{ height: '18px', background: form.popular ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.08)' }}>
                    <div className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all"
                      style={{ left: form.popular ? '16px' : '2px', background: form.popular ? '#D4AF37' : 'rgba(161,161,170,0.64)' }} />
                  </div>
                </button>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.86)' }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={save} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-black"
                  style={{ background: saving ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg,#B8951F,#D4AF37)', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  <Check size={14} /> {saving ? 'Salvando…' : 'Salvar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
