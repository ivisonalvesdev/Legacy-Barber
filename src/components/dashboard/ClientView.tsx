import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Clock, Star, Check, ChevronLeft, ChevronRight, CheckCircle, BadgeCheck, Scissors } from 'lucide-react'
import type { AppUser } from '../../types'
import { SERVICES, TIME_SLOTS } from '../../data/mock'
import { supabase } from '../../lib/supabase'

interface ClientViewProps {
  user: AppUser
}

type Barber = {
  id:           string
  name:         string
  specialty:    string
  avatar:       string
  available:    boolean
  rating:       number
  barbershopId: string | null
}

// ── Confetti burst ────────────────────────────────────────────
// Todos os confetes partem do centro do círculo (py-16 = 64px + h-24/2 = 48px → top 112px).
// Animação em 3 fases:
//   0→17%  burst rápido para fora  (easeOut)
//   17→55% arco descendente lento  (easeIn)
//   55→100% queda com aceleração   (easeIn)

const CONFETTI_COLORS = [
  '#D4AF37', '#ECCb52', '#F5D76E', '#FFF4D0',   // dourados
  '#B8951F', '#C4A227',                           // dourado escuro
  '#FFFFFF', 'rgba(255,255,255,0.85)',             // branco
  '#F59E0B', '#FBBF24',                           // âmbar
]

// Ângulo de ouro (137.508°) distribui pontos sem agrupamento visual
const PIECES = Array.from({ length: 80 }, (_, i) => {
  const angle   = ((i * 137.508) % 360) * (Math.PI / 180)
  const rFactor = 0.3 + ((i * 17 + 7) % 100) / 143       // 0.3 → 1.0
  const burstR  = 60 + rFactor * 120                       // 60 → 180 px
  return {
    id:    i,
    // posição do burst (relativa ao centro do círculo)
    bx:    Math.cos(angle) * burstR,
    by:    Math.sin(angle) * burstR,
    // queda após o burst  (sempre para baixo)
    fdx:   ((i * 13 + 5) % 80) - 40,                       // drift lateral ±40 px
    fdy:   400 + (i * 23 % 320),                            // queda 400→720 px
    // timing
    dur:   4.0 + (i * 7 % 100) / 55,                       // 4.0 → 5.8 s  (lento)
    delay: (i * 31 % 43) / 140,                             // 0 → 0.31 s
    // visual
    rot:   (i % 2 ? 1 : -1) * (240 + i * 67 % 360),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    w:     5 + (i % 5) * 2,
    h:     4 + (i % 4) * 2,
    round: i % 5 === 0,
  }
})

function ConfettiRain() {
  const reduced = useReducedMotion()
  if (reduced) return null

  // div de tamanho zero posicionada no centro exato do círculo
  // circle center-y = py-16(64px) + h-24/2(48px) = 112px
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', left: '50%', top: '112px',
        width: 0, height: 0, zIndex: -1, pointerEvents: 'none',
      }}>
      {PIECES.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0.95 }}
          animate={{
            // 4 pontos: origem → pico do burst → meio da queda → fim da queda
            x:      [0,    p.bx,                p.bx + p.fdx * 0.55,  p.bx + p.fdx],
            y:      [0,    p.by,                p.by + p.fdy * 0.38,   p.by + p.fdy],
            rotate: [0,    p.rot * 0.35,        p.rot * 0.72,           p.rot],
            opacity:[0.95, 1,                   0.78,                   0],
          }}
          transition={{
            duration: p.dur,
            delay:    p.delay,
            times:    [0, 0.17, 0.52, 1],
            ease:     ['easeOut', 'easeIn', 'easeIn'],
          }}
          style={{
            position:    'absolute',
            left:        -p.w / 2,   // centraliza a peça no ponto de origem
            top:         -p.h / 2,
            width:        p.w,
            height:       p.round ? p.w : p.h,
            background:   p.color,
            borderRadius: p.round ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

export function ClientView({ user }: ClientViewProps) {
  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1)
  const [selService, setSelService] = useState<typeof SERVICES[0] | null>(null)
  const [selBarber,  setSelBarber]  = useState<Barber | null>(null)
  const [barbers,    setBarbers]    = useState<Barber[]>([])
  const [saving,     setSaving]     = useState(false)
  const [bookingErr, setBookingErr] = useState('')
  const [selTime,    setSelTime]    = useState<string | null>(null)
  const [selDate,    setSelDate]    = useState(() => new Date().toISOString().split('T')[0])
  const [confirmed,  setConfirmed]  = useState(false)

  const canNext =
    (step === 1 && !!selService) ||
    (step === 2 && !!selBarber)  ||
    (step === 3 && !!selDate && !!selTime)

  const prev  = () => step > 1 && setStep((step - 1) as 1 | 2 | 3 | 4)
  const next  = () => canNext && setStep((step + 1) as 2 | 3 | 4)
  const reset = () => { setConfirmed(false); setStep(1); setSelService(null); setSelBarber(null); setSelTime(null) }

  const STEPS = [
    { n: 1, label: 'Serviço'      },
    { n: 2, label: 'Profissional' },
    { n: 3, label: 'Data & Hora'  },
    { n: 4, label: 'Confirmação'  },
  ]

  // Busca barbeiros reais do banco (incluindo barbershop_id para o insert)
  useEffect(() => {
    supabase.from('profiles').select('id,name,specialty,avatar,barbershop_id').eq('role', 'barber')
      .then(({ data }) => {
        if (data) setBarbers(data.map(b => ({
          id:           b.id,
          name:         b.name,
          specialty:    b.specialty ?? 'Barbeiro',
          avatar:       b.avatar ?? b.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
          available:    true,
          rating:       4.9,
          barbershopId: b.barbershop_id ?? null,
        })))
      })
  }, [])

  // Salva agendamento no Supabase
  const handleConfirm = async () => {
    if (!selService || !selBarber || !selTime) return
    setSaving(true)
    setBookingErr('')
    const { error } = await supabase.from('bookings').insert({
      client_id:     user.id,
      barber_id:     selBarber.id,
      barbershop_id: selBarber.barbershopId,   // ← tenant isolation
      service_name:  selService.name,
      service_price: selService.price,
      date:          selDate,
      time:          selTime,
      status:        'upcoming',
    })
    setSaving(false)
    if (error) setBookingErr('Erro ao salvar agendamento. Tente novamente.')
    else       setConfirmed(true)
  }

  if (confirmed) return (
    /* isolation:isolate cria stacking context próprio — confetes ficam em z:-1
       sem vazar para fora do container nem cobrir nenhum elemento de conteúdo */
    <div className="relative" style={{ minHeight: '80vh', overflow: 'hidden', isolation: 'isolate' }}>
      <ConfettiRain />

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="relative flex flex-col items-center text-center max-w-md mx-auto py-16"
        style={{ zIndex: 1 }}>

        {/* ícone pulsante */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 40px rgba(212,175,55,0.18)', '0 0 80px rgba(212,175,55,0.36)', '0 0 40px rgba(212,175,55,0.18)'] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)' }}>
          <CheckCircle size={48} style={{ color: '#D4AF37' }} />
        </motion.div>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
          Agendamento Confirmado!
        </h2>
        <p style={{ color: 'rgba(113,113,122,0.8)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
          Obrigado, <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{user.name.split(' ')[0]}</strong>!<br />
          {selBarber?.name.split(' ')[0]} te espera no horário marcado.
        </p>

        <div className="w-full rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.16)' }}>
          {[['Serviço', selService?.name], ['Barbeiro', selBarber?.name], ['Data', selDate], ['Horário', selTime]].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'rgba(113,113,122,0.6)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3">
            <span style={{ color: 'rgba(113,113,122,0.6)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
            <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '20px' }}>R$ {selService?.price}</span>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={reset}
          className="w-full py-3 rounded-xl font-semibold text-black text-sm"
          style={{ background: 'linear-gradient(135deg, #C4A227, #D4AF37, #E8C547)' }}>
          Fazer Novo Agendamento
        </motion.button>
      </motion.div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
          Olá, {user.name.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>Faça seu agendamento em minutos</p>
      </div>

      {/* Stepper */}
      <div className="mb-10">
        <div className="flex items-center">
          {STEPS.map((s, idx) => (
            <div key={s.n} className="flex items-center" style={{ flex: idx < STEPS.length - 1 ? 1 : 'none' }}>
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={{
                    background: step > s.n ? 'rgba(212,175,55,0.9)' : step === s.n ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                    borderColor: step >= s.n ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.07)',
                    scale: step === s.n ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center border">
                  {step > s.n
                    ? <Check size={14} className="text-black" />
                    : <span style={{ fontSize: '12px', fontWeight: 700, color: step === s.n ? '#D4AF37' : 'rgba(113,113,122,0.5)' }}>{s.n}</span>
                  }
                </motion.div>
                <span style={{ fontSize: '10px', fontWeight: 500, whiteSpace: 'nowrap', color: step === s.n ? '#D4AF37' : step > s.n ? 'rgba(161,161,170,0.7)' : 'rgba(113,113,122,0.45)' }}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <motion.div
                  animate={{ background: step > s.n ? 'rgba(212,175,55,0.38)' : 'rgba(255,255,255,0.05)' }}
                  transition={{ duration: 0.5 }}
                  style={{ flex: 1, height: '1px', margin: '0 10px 20px' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
              Qual serviço você deseja?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map((sv, idx) => {
                const sel = selService?.id === sv.id
                return (
                  <motion.button key={sv.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelService(sv)}
                    className="relative text-left rounded-2xl p-5 transition-all duration-200"
                    style={{
                      background: sel ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.022)',
                      border: `1px solid ${sel ? 'rgba(212,175,55,0.42)' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: sel ? '0 0 35px rgba(212,175,55,0.12)' : 'none',
                    }}>
                    {sv.popular && (
                      <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(212,175,55,0.14)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.22)' }}>
                        Popular
                      </div>
                    )}
                    <div style={{ fontSize: '22px', marginBottom: '10px' }}>{sv.emoji}</div>
                    <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginBottom: '6px', lineHeight: 1.3 }}>{sv.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(113,113,122,0.7)', fontSize: '12px', marginBottom: '10px' }}>
                      <Clock size={11} />{sv.duration}
                    </div>
                    <div style={{ color: sel ? '#D4AF37' : 'rgba(138,111,32,0.9)', fontWeight: 700, fontSize: '18px' }}>R$ {sv.price}</div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
              Escolha seu profissional
            </h2>
            <div className="space-y-3">
              {barbers.length === 0 && (
                <p className="col-span-3 text-center py-4" style={{ color: 'rgba(113,113,122,0.5)', fontSize: '13px' }}>
                  Nenhum barbeiro cadastrado ainda.
                </p>
              )}
              {barbers.map((b, idx) => {
                const sel = selBarber?.id === b.id
                return (
                  <motion.button key={b.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    whileHover={b.available ? { x: 4 } : {}}
                    onClick={() => b.available && setSelBarber(b)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200"
                    style={{
                      background: sel ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.022)',
                      border: `1px solid ${sel ? 'rgba(212,175,55,0.38)' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: sel ? '0 0 30px rgba(212,175,55,0.09)' : 'none',
                      opacity: b.available ? 1 : 0.38,
                      cursor: b.available ? 'pointer' : 'not-allowed',
                    }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{ background: sel ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', color: sel ? '#D4AF37' : 'rgba(113,113,122,0.8)', border: sel ? '1px solid rgba(212,175,55,0.28)' : '1px solid rgba(255,255,255,0.07)' }}>
                        {b.avatar}
                      </div>
                      {b.available && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500" style={{ border: '2px solid #050505' }} />}
                    </div>
                    <div className="flex-1 text-left">
                      <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{b.name}</div>
                      <div style={{ color: 'rgba(113,113,122,0.65)', fontSize: '12px', marginTop: '2px' }}>{b.specialty}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Star size={12} fill="#D4AF37" style={{ color: '#D4AF37' }} />
                        <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{b.rating}</span>
                      </div>
                      {!b.available && <span style={{ fontSize: '9px', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Indisponível</span>}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
              Quando você prefere?
            </h2>
            <div className="mb-6">
              <label style={{ fontSize: '11px', color: 'rgba(113,113,122,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Data</label>
              <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'rgba(113,113,122,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Horário</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((t, idx) => {
                  const sel = selTime === t
                  return (
                    <motion.button key={t}
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.035 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelTime(t)}
                      className="py-2 rounded-lg font-mono text-xs font-semibold"
                      style={{
                        background: sel ? '#D4AF37' : 'rgba(255,255,255,0.028)',
                        color: sel ? '#000' : 'rgba(161,161,170,0.75)',
                        border: `1px solid ${sel ? '#D4AF37' : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: sel ? '0 0 22px rgba(212,175,55,0.35)' : 'none',
                        transition: 'all 0.15s ease',
                      }}>
                      {t}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '24px' }}>
              Confirmar Agendamento
            </h2>
            <div className="rounded-2xl overflow-hidden mb-6"
              style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.045)' }}>
                <div className="flex items-center gap-2">
                  <Scissors size={13} style={{ color: '#D4AF37' }} />
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", color: '#D4AF37', fontWeight: 600, fontSize: '15px' }}>LEGACY BARBER</span>
                </div>
                <BadgeCheck size={15} style={{ color: '#D4AF37' }} />
              </div>
              <div className="px-6 py-5 space-y-3.5">
                {[['Cliente', user.name], ['Serviço', selService?.name], ['Barbeiro', selBarber?.name], ['Data', selDate], ['Horário', selTime]].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
                  <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '22px' }}>R$ {selService?.price}</span>
                </div>
              </div>
            </div>
            {bookingErr && (
              <p className="text-xs text-center mb-2" style={{ color: '#f87171' }}>{bookingErr}</p>
            )}
            <motion.button
              whileHover={{ scale: 1.01, boxShadow: '0 0 50px rgba(212,175,55,0.35)' }} whileTap={{ scale: 0.99 }}
              onClick={handleConfirm} disabled={saving}
              className="w-full py-3.5 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2"
              style={{ background: saving ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg, #B8951F, #D4AF37, #ECCb52)', letterSpacing: '0.02em', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Scissors size={15} />
                </motion.div>
              ) : 'Confirmar Agendamento'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-8">
        <button onClick={prev} disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
          style={{ color: step === 1 ? 'rgba(113,113,122,0.3)' : 'rgba(113,113,122,0.7)', cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
          <ChevronLeft size={15} />Voltar
        </button>
        {step < 4 && (
          <motion.button
            whileHover={canNext ? { scale: 1.03 } : {}} whileTap={canNext ? { scale: 0.97 } : {}}
            onClick={next} disabled={!canNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: canNext ? 'linear-gradient(135deg, #B8951F, #D4AF37)' : 'rgba(255,255,255,0.05)',
              color: canNext ? '#000' : 'rgba(113,113,122,0.38)',
              boxShadow: canNext ? '0 0 24px rgba(212,175,55,0.22)' : 'none',
              cursor: canNext ? 'pointer' : 'not-allowed', letterSpacing: '0.02em',
            }}>
            Continuar <ChevronRight size={15} />
          </motion.button>
        )}
      </div>
    </div>
  )
}
