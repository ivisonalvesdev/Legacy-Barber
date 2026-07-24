import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Clock, Star, Heart, Check, ChevronLeft, ChevronRight, CheckCircle, BadgeCheck, Scissors, Search, MapPin, Store, Crown } from 'lucide-react'
import type { AppUser, Service, Barbershop } from '../../types'
import { formatAddress } from '../../types'
import { TIME_SLOTS } from '../../data/defaults'
import { supabase } from '../../lib/supabase'
import { fireEvent, notifyBooking } from '../../lib/integrations'
import { ratingFromLikes } from '../../lib/rating'
import { Avatar } from '../ui/Avatar'

interface ClientViewProps {
  user: AppUser
}

type Barber = {
  id:           string
  name:         string
  specialty:    string
  avatar:       string
  avatarUrl:    string | null
  available:    boolean
  likes:        number   // curtidas recebidas (cada corte concluído vale 1)
  rating:       number   // nota derivada dos likes (ratingFromLikes)
  barbershopId: string | null
  isOwner:      boolean
}

// Mesma normalização de public.normalize_search() no banco: sem isso "José"
// digitado com acento não casaria com o search_text, que é gravado sem.
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

type ShopRow = {
  id: string; name: string; description: string | null; phone: string | null
  logo_url: string | null; published: boolean
  address_street: string | null; address_number: string | null
  address_district: string | null; address_city: string | null
  address_state: string | null; address_zip: string | null
}

const toShop = (r: ShopRow): Barbershop => ({
  id: r.id, name: r.name,
  description: r.description ?? undefined,
  phone:       r.phone ?? undefined,
  logoUrl:     r.logo_url ?? undefined,
  published:   r.published,
  address: {
    street:   r.address_street   ?? undefined,
    number:   r.address_number   ?? undefined,
    district: r.address_district ?? undefined,
    city:     r.address_city     ?? undefined,
    state:    r.address_state    ?? undefined,
    zip:      r.address_zip      ?? undefined,
  },
})

const SHOP_COLUMNS =
  'id,name,description,phone,logo_url,published,address_street,address_number,address_district,address_city,address_state,address_zip'

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

const todayISO = () => new Date().toISOString().split('T')[0]

type Step = 1 | 2 | 3 | 4 | 5

export function ClientView({ user }: ClientViewProps) {
  const [step, setStep]             = useState<Step>(1)
  const [selShop,    setSelShop]    = useState<Barbershop | null>(null)
  const [selBarber,  setSelBarber]  = useState<Barber | null>(null)
  const [selService, setSelService] = useState<Service | null>(null)
  const [shops,      setShops]      = useState<Barbershop[]>([])
  const [shopQuery,  setShopQuery]  = useState('')
  const [shopLoading, setShopLoad]  = useState(true)
  const [barbers,    setBarbers]    = useState<Barber[]>([])
  const [barberLoading, setBarbLoad] = useState(false)
  const [services,   setServices]   = useState<Service[]>([])
  const [svcLoading, setSvcLoading] = useState(false)
  const [taken,      setTaken]      = useState<Set<string>>(new Set())
  const [saving,     setSaving]     = useState(false)
  const [bookingErr, setBookingErr] = useState('')
  const [selTime,    setSelTime]    = useState<string | null>(null)
  const [selDate,    setSelDate]    = useState(todayISO)
  const [confirmed,  setConfirmed]  = useState(false)

  const canNext =
    (step === 1 && !!selShop)    ||
    (step === 2 && !!selBarber)  ||
    (step === 3 && !!selService) ||
    (step === 4 && !!selDate && !!selTime)

  const prev  = () => step > 1 && setStep((step - 1) as Step)
  const next  = () => canNext && setStep((step + 1) as Step)
  const reset = () => {
    setConfirmed(false); setStep(1)
    setSelShop(null); setSelBarber(null); setSelService(null); setSelTime(null)
    setBookingErr(''); setShopQuery('')
  }

  const STEPS = [
    { n: 1, label: 'Barbearia'    },
    { n: 2, label: 'Profissional' },
    { n: 3, label: 'Serviço'      },
    { n: 4, label: 'Data & Hora'  },
    { n: 5, label: 'Confirmação'  },
  ]

  // ── Vitrine: barbearias publicadas, filtradas por nome/bairro/cidade ──
  useEffect(() => {
    let cancelled = false
    // Espera a digitação parar: sem isto cada tecla vira uma consulta.
    const timer = setTimeout(async () => {
      setShopLoad(true)
      let q = supabase.from('barbershops').select(SHOP_COLUMNS).eq('published', true)
      const term = normalize(shopQuery)
      if (term) q = q.ilike('search_text', `%${term}%`)

      try {
        const { data } = await q.order('name').limit(50)
        if (cancelled) return
        setShops(((data ?? []) as ShopRow[]).map(toShop))
      } catch {
        if (!cancelled) setShops([])
      } finally {
        if (!cancelled) setShopLoad(false)
      }
    }, shopQuery ? 280 : 0)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [shopQuery])

  // ── Barbeiros da barbearia escolhida ─────────────────────────
  // O dono (admin) também entra na lista: muitas vezes ele é um dos
  // barbeiros — aparece primeiro, com o selo de dono. A nota (estrelas) de
  // cada um vem dos likes reais (RPC barber_like_counts), não de um valor fixo.
  useEffect(() => {
    if (!selShop) { setBarbers([]); return }
    let cancelled = false
    setBarbLoad(true)

    const load = async () => {
      const [{ data: profs }, { data: likeRows }] = await Promise.all([
        supabase.from('profiles')
          .select('id,name,specialty,avatar,avatar_url,barbershop_id,active,role')
          .in('role', ['barber', 'admin'])
          .eq('barbershop_id', selShop.id)
          .eq('active', true)
          .order('name'),
        supabase.rpc('barber_like_counts', { p_shop: selShop.id }),
      ])
      if (cancelled) return

      const likesByBarber = new Map<string, number>(
        ((likeRows ?? []) as { barber_id: string; likes: number }[])
          .map(r => [r.barber_id, Number(r.likes)]),
      )

      const list: Barber[] = (profs ?? []).map(b => {
        const likes = likesByBarber.get(b.id) ?? 0
        return {
          id:           b.id,
          name:         b.name,
          specialty:    b.specialty ?? (b.role === 'admin' ? 'CEO & Barbeiro' : 'Barbeiro'),
          avatar:       b.avatar || b.name,
          avatarUrl:    b.avatar_url ?? null,
          available:    b.active ?? true,
          likes,
          rating:       ratingFromLikes(likes),
          barbershopId: b.barbershop_id ?? null,
          isOwner:      b.role === 'admin',
        }
      })
      list.sort((a, b) => Number(b.isOwner) - Number(a.isOwner))
      setBarbers(list)
      setBarbLoad(false)
    }

    load().catch(() => { if (!cancelled) { setBarbers([]); setBarbLoad(false) } })
    return () => { cancelled = true }
  }, [selShop])

  // ── Catálogo de serviços da barbearia escolhida ──────────────
  useEffect(() => {
    if (!selShop) { setServices([]); return }

    setSvcLoading(true)
    supabase.from('services')
      .select('id, name, duration_min, price, emoji, popular')
      .eq('barbershop_id', selShop.id)
      .eq('active', true)
      .order('price')
      .then(({ data }) => {
        // Sem fallback local: o banco valida nome+preço contra o catálogo real,
        // então oferecer serviço inexistente só produziria erro na confirmação.
        setServices((data ?? []).map(s => ({
          id:          s.id,
          name:        s.name,
          durationMin: s.duration_min,
          price:       Number(s.price),
          emoji:       s.emoji,
          popular:     s.popular,
          active:      true, // a query acima já filtra .eq('active', true)
        })))
        setSvcLoading(false)
      }, () => { setServices([]); setSvcLoading(false) })
  }, [selShop])

  // ── Horários já ocupados do barbeiro na data escolhida ───────
  // Via RPC taken_slots (SECURITY DEFINER): a RLS de bookings esconde os
  // agendamentos de OUTROS clientes, então uma consulta direta só devolveria
  // os do próprio cliente. A RPC devolve apenas os horários (sem quem reservou)
  // — assim o slot ocupado já aparece riscado e bloqueado, sem vazar dados.
  useEffect(() => {
    if (!selBarber || !selDate) { setTaken(new Set()); return }
    let cancelled = false
    supabase.rpc('taken_slots', { p_barber: selBarber.id, p_date: selDate })
      .then(({ data }) => {
        if (cancelled) return
        setTaken(new Set(((data ?? []) as { time: string }[]).map(r => r.time)))
      }, () => { if (!cancelled) setTaken(new Set()) })
    return () => { cancelled = true }
  }, [selBarber, selDate])

  // Horários no passado (quando a data é hoje) também ficam bloqueados
  const isPastSlot = (t: string) => {
    if (selDate !== todayISO()) return false
    const [h, m] = t.split(':').map(Number)
    const now = new Date()
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes()
  }

  // ── Salva agendamento no Supabase ────────────────────────────
  const handleConfirm = async () => {
    if (!selService || !selBarber || !selShop || !selTime) return
    setSaving(true)
    setBookingErr('')
    const { data: created, error } = await supabase.from('bookings').insert({
      client_id:     user.id,
      barber_id:     selBarber.id,
      barbershop_id: selShop.id,   // ← tenant isolation (o banco reconfere)
      service_name:  selService.name,
      service_price: selService.price,
      date:          selDate,
      time:          selTime,
      status:        'upcoming',
    }).select('id').single()
    setSaving(false)
    if (error) {
      // 23505 = violação do índice único (slot acabou de ser ocupado)
      if (error.code === '23505') {
        setBookingErr('Esse horário acabou de ser reservado por outro cliente. Escolha outro.')
        setTaken(prev => new Set(prev).add(selTime))
        setSelTime(null)
        setStep(4)
      } else if (error.code === '42501') {
        // WITH CHECK barrou: catálogo mudou no meio do fluxo (preço/serviço)
        setBookingErr('Os dados da barbearia mudaram. Recarregue a página e tente de novo.')
      } else {
        setBookingErr('Erro ao salvar agendamento. Tente novamente.')
      }
    } else {
      setConfirmed(true)
      // Push (Edge Function): avisa barbeiro e dono na hora. Independe do n8n.
      if (created?.id) notifyBooking(created.id)
      // Automação (n8n): base para confirmação/lembrete via WhatsApp.
      // Não bloqueia — o agendamento já está salvo.
      fireEvent('booking.created', {
        source:        'client',
        barbershop:    { id: selShop.id, name: selShop.name, phone: selShop.phone ?? null },
        client:        { id: user.id, name: user.name, phone: user.phone },
        barber:        { id: selBarber.id, name: selBarber.name },
        service:       { name: selService.name, price: selService.price },
        date:          selDate,
        time:          selTime,
      })
    }
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
        <p style={{ color: 'rgba(113,113,122,0.86)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
          Obrigado, <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{user.name.split(' ')[0]}</strong>!<br />
          {selBarber?.name.split(' ')[0]} te espera no horário marcado.
        </p>

        <div className="w-full rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.16)' }}>
          {[['Barbearia', selShop?.name], ['Serviço', selService?.name], ['Barbeiro', selBarber?.name], ['Data', selDate], ['Horário', selTime]].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'rgba(113,113,122,0.82)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3">
            <span style={{ color: 'rgba(113,113,122,0.82)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
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
        <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>Faça seu agendamento em minutos</p>
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
                    : <span style={{ fontSize: '12px', fontWeight: 700, color: step === s.n ? '#D4AF37' : 'rgba(113,113,122,0.64)' }}>{s.n}</span>
                  }
                </motion.div>
                {/* No mobile o título de cada passo já dá o contexto; 5 labels
                    lado a lado estourariam a linha. */}
                <span className="hidden sm:block"
                  style={{ fontSize: '10px', fontWeight: 500, whiteSpace: 'nowrap', color: step === s.n ? '#D4AF37' : step > s.n ? 'rgba(161,161,170,0.86)' : 'rgba(113,113,122,0.58)' }}>
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
              Escolha a barbearia
            </h2>

            {/* Busca por nome, bairro ou cidade */}
            <div className="relative mb-4">
              <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(113,113,122,0.64)' }} />
              <input
                value={shopQuery} onChange={e => setShopQuery(e.target.value)}
                placeholder="Buscar por nome, bairro ou cidade…"
                className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }} />
            </div>

            <div className="space-y-3">
              {shopLoading && (
                <p className="text-center py-6" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>Buscando…</p>
              )}
              {!shopLoading && shops.length === 0 && (
                <div className="text-center py-10 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.07)' }}>
                  <Store size={22} style={{ color: 'rgba(113,113,122,0.52)', margin: '0 auto 10px' }} />
                  <p style={{ color: 'rgba(113,113,122,0.82)', fontSize: '13px' }}>
                    {shopQuery ? 'Nenhuma barbearia encontrada para essa busca.' : 'Nenhuma barbearia disponível ainda.'}
                  </p>
                </div>
              )}
              {!shopLoading && shops.map((s, idx) => {
                const sel  = selShop?.id === s.id
                const addr = formatAddress(s.address)
                return (
                  <motion.button key={s.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 6) * 0.06 }}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      // Trocar de barbearia invalida tudo que dependia dela
                      if (selShop?.id !== s.id) { setSelBarber(null); setSelService(null); setSelTime(null) }
                      setSelShop(s)
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200"
                    style={{
                      background: sel ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.022)',
                      border: `1px solid ${sel ? 'rgba(212,175,55,0.38)' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: sel ? '0 0 30px rgba(212,175,55,0.09)' : 'none',
                    }}>
                    <Avatar url={s.logoUrl} fallback={s.name} size={48} rounded="xl" highlight={sel} />
                    <div className="flex-1 text-left min-w-0">
                      <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '14px' }} className="truncate">{s.name}</div>
                      {addr ? (
                        <div className="flex items-center gap-1 mt-1" style={{ color: 'rgba(113,113,122,0.77)', fontSize: '12px' }}>
                          <MapPin size={10} className="flex-shrink-0" />
                          <span className="truncate">{addr}</span>
                        </div>
                      ) : (
                        <div style={{ color: 'rgba(113,113,122,0.58)', fontSize: '12px', marginTop: '2px' }}>Endereço não informado</div>
                      )}
                    </div>
                    {sel && <Check size={16} style={{ color: '#D4AF37', flexShrink: 0 }} />}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>
              Escolha seu profissional
            </h2>
            <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '12px', marginBottom: '20px' }}>
              Equipe da {selShop?.name}
            </p>
            <div className="space-y-3">
              {barberLoading && (
                <p className="text-center py-6" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>Carregando equipe…</p>
              )}
              {!barberLoading && barbers.length === 0 && (
                <p className="text-center py-6" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>
                  Esta barbearia ainda não tem barbeiros disponíveis.
                </p>
              )}
              {!barberLoading && barbers.map((b, idx) => {
                const sel = selBarber?.id === b.id
                return (
                  <motion.button key={b.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    whileHover={b.available ? { x: 4 } : {}}
                    onClick={() => {
                      if (!b.available) return
                      if (selBarber?.id !== b.id) { setSelService(null); setSelTime(null) }
                      setSelBarber(b)
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200"
                    style={{
                      background: sel ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.022)',
                      border: `1px solid ${sel ? 'rgba(212,175,55,0.38)' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: sel ? '0 0 30px rgba(212,175,55,0.09)' : 'none',
                      opacity: b.available ? 1 : 0.38,
                      cursor: b.available ? 'pointer' : 'not-allowed',
                    }}>
                    <div className="relative flex-shrink-0">
                      <Avatar url={b.avatarUrl} fallback={b.avatar} size={48} rounded="xl" highlight={sel} />
                      {b.available && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500" style={{ border: '2px solid #050505' }} />}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{b.name}</span>
                        {b.isOwner && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em',
                              background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08))',
                              border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
                            }}>
                            <Crown size={8} /> CEO
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'rgba(113,113,122,0.77)', fontSize: '12px', marginTop: '2px' }}>{b.specialty}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {b.likes > 0 ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Star size={12} fill="#D4AF37" style={{ color: '#D4AF37' }} />
                            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                              {b.rating.toFixed(1).replace('.', ',')}
                            </span>
                          </div>
                          <span className="flex items-center gap-1" style={{ fontSize: '10px', color: 'rgba(212,175,55,0.72)', fontWeight: 600 }}>
                            <Heart size={9} fill="#D4AF37" style={{ color: '#D4AF37' }} />
                            {b.likes} {b.likes === 1 ? 'curtida' : 'curtidas'}
                          </span>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full"
                          style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.75)', border: '1px solid rgba(212,175,55,0.2)' }}>
                          Novo
                        </span>
                      )}
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
              Qual serviço você deseja?
            </h2>
            {svcLoading && (
              <p className="text-center py-6" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>Carregando catálogo…</p>
            )}
            {!svcLoading && services.length === 0 && (
              <p className="text-center py-6" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>
                Esta barbearia ainda não cadastrou serviços.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {!svcLoading && services.map((sv, idx) => {
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(113,113,122,0.86)', fontSize: '12px', marginBottom: '10px' }}>
                      <Clock size={11} />{sv.durationMin}min
                    </div>
                    <div style={{ color: sel ? '#D4AF37' : 'rgba(138,111,32,0.9)', fontWeight: 700, fontSize: '18px' }}>R$ {sv.price}</div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
              Quando você prefere?
            </h2>
            <div className="mb-6">
              <label style={{ fontSize: '11px', color: 'rgba(113,113,122,0.77)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Data</label>
              <input type="date" value={selDate} min={todayISO()}
                onChange={e => { setSelDate(e.target.value); setSelTime(null) }}
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'rgba(113,113,122,0.77)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Horário</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((t, idx) => {
                  const sel      = selTime === t
                  const blocked  = taken.has(t) || isPastSlot(t)
                  return (
                    <motion.button key={t}
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.035 }}
                      whileHover={blocked ? {} : { scale: 1.05 }} whileTap={blocked ? {} : { scale: 0.95 }}
                      onClick={() => !blocked && setSelTime(t)}
                      disabled={blocked}
                      className="py-2 rounded-lg font-mono text-xs font-semibold"
                      style={{
                        background: sel ? '#D4AF37' : blocked ? 'rgba(255,255,255,0.012)' : 'rgba(255,255,255,0.028)',
                        color: sel ? '#000' : blocked ? 'rgba(113,113,122,0.64)' : 'rgba(161,161,170,0.84)',
                        border: `1px solid ${sel ? '#D4AF37' : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: sel ? '0 0 22px rgba(212,175,55,0.35)' : 'none',
                        textDecoration: taken.has(t) ? 'line-through' : 'none',
                        cursor: blocked ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}>
                      {t}
                    </motion.button>
                  )
                })}
              </div>
              {taken.size > 0 && (
                <p style={{ fontSize: '11px', color: 'rgba(113,113,122,0.64)', marginTop: '10px' }}>
                  Horários riscados já estão reservados para {selBarber?.name.split(' ')[0]}.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '24px' }}>
              Confirmar Agendamento
            </h2>
            <div className="rounded-2xl overflow-hidden mb-6"
              style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
              {/* Cabeçalho identifica a barbearia escolhida, não a marca do app */}
              <div className="px-6 py-4 flex items-center justify-between gap-3"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.045)' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  {selShop?.logoUrl
                    ? <Avatar url={selShop.logoUrl} fallback={selShop.name} size={26} rounded="xl" highlight />
                    : <Scissors size={13} style={{ color: '#D4AF37', flexShrink: 0 }} />}
                  <span className="truncate" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#D4AF37', fontWeight: 600, fontSize: '15px' }}>
                    {selShop?.name ?? 'LEGACY BARBER'}
                  </span>
                </div>
                <BadgeCheck size={15} style={{ color: '#D4AF37', flexShrink: 0 }} />
              </div>
              <div className="px-6 py-5 space-y-3.5">
                {selShop && formatAddress(selShop.address) && (
                  <div className="flex items-start justify-between gap-4 pb-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.68)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Endereço</span>
                    <span className="text-right" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{formatAddress(selShop.address)}</span>
                  </div>
                )}
                {[['Cliente', user.name], ['Serviço', selService?.name], ['Barbeiro', selBarber?.name], ['Data', selDate], ['Horário', selTime]].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.68)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.68)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
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
          style={{ color: step === 1 ? 'rgba(113,113,122,0.52)' : 'rgba(113,113,122,0.86)', cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
          <ChevronLeft size={15} />Voltar
        </button>
        {step < 5 && (
          <motion.button
            whileHover={canNext ? { scale: 1.03 } : {}} whileTap={canNext ? { scale: 0.97 } : {}}
            onClick={next} disabled={!canNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: canNext ? 'linear-gradient(135deg, #B8951F, #D4AF37)' : 'rgba(255,255,255,0.05)',
              color: canNext ? '#000' : 'rgba(113,113,122,0.64)',
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
