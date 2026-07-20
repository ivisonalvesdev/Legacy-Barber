import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarPlus, X, Check, User } from 'lucide-react'
import type { AppUser, Service } from '../../types'
import { TIME_SLOTS, DEFAULT_SERVICES } from '../../data/defaults'
import { supabase } from '../../lib/supabase'
import { fireEvent, notifyBooking } from '../../lib/integrations'

interface NewBookingModalProps {
  user:      AppUser
  open:      boolean
  onClose:   () => void
  onCreated: () => void
}

type BarberOpt = { id: string; name: string }

// Agendamento manual (walk-in / telefone): criado pelo admin sem conta de cliente.
export function NewBookingModal({ user, open, onClose, onCreated }: NewBookingModalProps) {
  const [barbers, setBarbers]     = useState<BarberOpt[]>([])
  const [services, setServices]   = useState<Service[]>([])
  const [taken, setTaken]         = useState<Set<string>>(new Set())
  const [clientName, setClient]   = useState('')
  const [barberId, setBarberId]   = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate]           = useState(() => new Date().toISOString().split('T')[0])
  const [time, setTime]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  // Carrega equipe + catálogo quando o modal abre
  useEffect(() => {
    if (!open || !user.barbershopId) return
    supabase.from('profiles')
      .select('id, name, role')
      .eq('barbershop_id', user.barbershopId)
      .in('role', ['barber', 'admin'])
      .eq('active', true)
      .then(({ data }) => {
        // CEO primeiro e sinalizado — walk-in também pode cair com ele
        const opts = (data ?? [])
          .sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin'))
          .map(b => ({ id: b.id, name: b.role === 'admin' ? `${b.name} · CEO` : b.name }))
        setBarbers(opts)
        if (opts.length > 0 && !barberId) setBarberId(opts[0].id)
      }, () => setBarbers([]))
    supabase.from('services')
      .select('id, name, duration_min, price, emoji, popular')
      .eq('barbershop_id', user.barbershopId)
      .eq('active', true)
      .order('price')
      .then(({ data, error: err }) => {
        const list = (err || !data || data.length === 0)
          ? DEFAULT_SERVICES
          : data.map(s => ({
              id: s.id, name: s.name, durationMin: s.duration_min,
              price: Number(s.price), emoji: s.emoji, popular: s.popular,
              active: true, // a query acima já filtra .eq('active', true)
            }))
        setServices(list)
        if (list.length > 0) setServiceId(prev => prev || list[0].id)
      }, () => setServices(DEFAULT_SERVICES))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user.barbershopId])

  // Horários ocupados do barbeiro na data
  useEffect(() => {
    if (!open || !barberId || !date) { setTaken(new Set()); return }
    supabase.from('bookings')
      .select('time')
      .eq('barber_id', barberId)
      .eq('date', date)
      .neq('status', 'cancelled')
      .then(({ data }) => setTaken(new Set((data ?? []).map(b => b.time))), () => setTaken(new Set()))
  }, [open, barberId, date])

  const save = async () => {
    const svc = services.find(s => s.id === serviceId)
    if (!clientName.trim() || !barberId || !svc || !date || !time) {
      setError('Preencha todos os campos.')
      return
    }
    setSaving(true)
    setError('')
    const { data: created, error: err } = await supabase.from('bookings').insert({
      client_id:     null,
      client_name:   clientName.trim(),
      barber_id:     barberId,
      barbershop_id: user.barbershopId,
      service_name:  svc.name,
      service_price: svc.price,
      date,
      time,
      status:        'upcoming',
    }).select('id').single()
    setSaving(false)
    if (err) {
      setError(err.code === '23505'
        ? 'Esse horário já está ocupado para este barbeiro.'
        : 'Erro ao criar agendamento. Execute supabase/setup_final.sql se ainda não rodou.')
      return
    }
    // Push (Edge Function): avisa o barbeiro designado. Dedup no servidor
    // evita notificar o próprio admin quando ele é o barbeiro.
    if (created?.id) notifyBooking(created.id)
    // Automação (n8n): mesmo evento do agendamento pelo cliente, marcado
    // como walk-in. O barbeiro é conhecido pelo id; nome resolvido no n8n.
    fireEvent('booking.created', {
      source:        'walk-in',
      barbershop:    { id: user.barbershopId, name: user.barbershopName ?? null },
      client:        { id: null, name: clientName.trim() },
      barber:        { id: barberId },
      service:       { name: svc.name, price: svc.price },
      date,
      time,
    })

    setClient(''); setTime('')
    onCreated()
    onClose()
  }

  const selectStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.85)',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}>
          <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CalendarPlus size={16} style={{ color: '#D4AF37' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: 'white' }}>
                  Novo Agendamento
                </h3>
              </div>
              <button onClick={onClose} style={{ color: 'rgba(113,113,122,0.64)' }}>
                <X size={17} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'rgba(113,113,122,0.77)', marginBottom: '16px', lineHeight: 1.5 }}>
              Para clientes que chegam sem conta (walk-in ou telefone).
            </p>

            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <User size={11} /> Nome do cliente
                </label>
                <input value={clientName} onChange={e => setClient(e.target.value)}
                  placeholder="Ex: João Pereira"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={selectStyle} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Barbeiro
                </label>
                <select value={barberId} onChange={e => { setBarberId(e.target.value); setTime('') }}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={selectStyle}>
                  {barbers.length === 0 && <option value="" style={{ background: '#0d0d0d' }}>Nenhum barbeiro ativo</option>}
                  {barbers.map(b => (
                    <option key={b.id} value={b.id} style={{ background: '#0d0d0d' }}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Serviço
                </label>
                <select value={serviceId} onChange={e => setServiceId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={selectStyle}>
                  {services.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#0d0d0d' }}>
                      {s.name} — R$ {s.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Data
                </label>
                <input type="date" value={date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setDate(e.target.value); setTime('') }}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={{ ...selectStyle, colorScheme: 'dark' }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Horário
                </label>
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {TIME_SLOTS.map(t => {
                    const blocked = taken.has(t)
                    const sel = time === t
                    return (
                      <button key={t} onClick={() => !blocked && setTime(t)} disabled={blocked}
                        className="py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all"
                        style={{
                          background: sel ? '#D4AF37' : blocked ? 'rgba(255,255,255,0.012)' : 'rgba(255,255,255,0.03)',
                          color: sel ? '#000' : blocked ? 'rgba(113,113,122,0.34)' : 'rgba(161,161,170,0.86)',
                          border: `1px solid ${sel ? '#D4AF37' : 'rgba(255,255,255,0.06)'}`,
                          textDecoration: blocked ? 'line-through' : 'none',
                          cursor: blocked ? 'not-allowed' : 'pointer',
                        }}>
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && (
                <p className="text-xs text-center py-2 rounded-xl"
                  style={{ color: '#f87171', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.16)' }}>
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.86)' }}>
                Cancelar
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-black"
                style={{ background: saving ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg,#B8951F,#D4AF37)', cursor: saving ? 'not-allowed' : 'pointer' }}>
                <Check size={14} /> {saving ? 'Salvando…' : 'Agendar'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
