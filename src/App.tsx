import { useState, useEffect, useRef } from 'react'
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useSpring,
} from 'framer-motion'
import {
  Calendar, Clock, User, Package, Users, LayoutDashboard,
  BarChart2, DollarSign, TrendingUp, Activity, Star,
  CheckCircle, Check, ChevronRight, ChevronLeft,
  Plus, Menu, X, Scissors, ArrowUpRight, BadgeCheck,
  LogIn, UserPlus, Eye, EyeOff, Phone, Lock, Mail,
  Building2, LogOut, Sparkles, Crown,
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════
type UserRole = 'admin' | 'barber' | 'client'

interface AppUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  password: string
  specialty?: string
  barbershopName?: string
  avatar: string
}

// ══════════════════════════════════════════════════════════════
// MOCK USERS (demo)
// ══════════════════════════════════════════════════════════════
const MOCK_USERS: AppUser[] = [
  { id: '1', name: 'Carlos Motta',    email: 'carlos@legacy.com', phone: '11999990001', role: 'barber', password: '123456', specialty: 'Degradê & Textura',   avatar: 'CM' },
  { id: '2', name: 'Diego Alves',     email: 'diego@legacy.com',  phone: '11999990002', role: 'barber', password: '123456', specialty: 'Barba Artística',     avatar: 'DA' },
  { id: '3', name: 'João Silva',      email: 'admin@legacy.com',  phone: '11999990003', role: 'admin',  password: '123456', barbershopName: 'Legacy Barber',  avatar: 'JS' },
  { id: '4', name: 'Pedro Cliente',   email: 'pedro@email.com',   phone: '11999990004', role: 'client', password: '123456', avatar: 'PC' },
]

// ══════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════
const SERVICES = [
  { id: 1, name: 'Corte Clássico',        duration: '30min', price: 30,  emoji: '✂️',  popular: false },
  { id: 2, name: 'Barba Completa',         duration: '20min', price: 20,  emoji: '🧔',  popular: false },
  { id: 3, name: 'Sobrancelha + Barba',    duration: '30min', price: 40,  emoji: '⚡',  popular: true  },
  { id: 4, name: 'Corte + Barba',          duration: '45min', price: 80,  emoji: '👑',  popular: true  },
  { id: 5, name: 'Tratamento Capilar',     duration: '60min', price: 110, emoji: '✨',  popular: false },
]

const BARBERS = [
  { id: 1, name: 'Carlos Motta',     specialty: 'Degradê & Textura', rating: 4.9, avatar: 'CM', available: true  },
  { id: 2, name: 'Diego Alves',      specialty: 'Barba Artística',   rating: 4.8, avatar: 'DA', available: true  },
  { id: 3, name: 'Vinicius Ferreira',specialty: 'Corte Clássico',    rating: 4.9, avatar: 'VF', available: false },
]

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:45','10:30','11:15',
  '13:00','13:45','14:30','15:15','16:00','17:00','18:00',
]

const INVENTORY = [
  { id: 1, name: 'Pomada Matte',         category: 'Finalizador',  stock: 8,  max: 20,  unit: 'un', cost: 45 },
  { id: 2, name: 'Óleo de Barba',        category: 'Barba',        stock: 3,  max: 15,  unit: 'un', cost: 38 },
  { id: 3, name: 'Shampoo Profissional', category: 'Cabelo',       stock: 12, max: 24,  unit: 'un', cost: 55 },
  { id: 4, name: 'Navalha Descartável',  category: 'Instrumental', stock: 45, max: 100, unit: 'cx', cost: 12 },
  { id: 5, name: 'Cera Modeladora',      category: 'Finalizador',  stock: 2,  max: 10,  unit: 'un', cost: 42 },
  { id: 6, name: 'Condicionador',        category: 'Cabelo',       stock: 7,  max: 20,  unit: 'un', cost: 48 },
]

const AGENDA_HOJE = [
  { time: '09:00', client: 'Bruno Carvalho', service: 'Corte + Barba',      status: 'done'     as const },
  { time: '09:45', client: 'Marcos Lima',    service: 'Corte Clássico',     status: 'done'     as const },
  { time: '10:30', client: 'Felipe Santos',  service: 'Barba Completa',     status: 'current'  as const },
  { time: '11:15', client: 'André Costa',    service: 'Corte Clássico',     status: 'upcoming' as const },
  { time: '14:00', client: 'Pedro Alves',    service: 'Tratamento Capilar', status: 'upcoming' as const },
  { time: '14:45', client: 'Rodrigo Nunes',  service: 'Corte + Barba',      status: 'upcoming' as const },
]

const REVENUE_DATA = [
  { day: 'Seg', value: 1240 },
  { day: 'Ter', value: 1680 },
  { day: 'Qua', value: 1420 },
  { day: 'Qui', value: 2100 },
  { day: 'Sex', value: 2580 },
  { day: 'Sáb', value: 3200 },
  { day: 'Dom', value: 980  },
]

// ══════════════════════════════════════════════════════════════
// AMBIENT BACKGROUND
// ══════════════════════════════════════════════════════════════
function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-[#050505]" />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.24, 0.18] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)', filter: 'blur(50px)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.07, 0.11, 0.07] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute -bottom-48 -right-48 w-[800px] h-[800px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(160,110,15,0.18) 0%, transparent 70%)', filter: 'blur(70px)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.15) 0%, transparent 65%)', filter: 'blur(90px)' }}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ══════════════════════════════════════════════════════════════
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    let start: number | undefined
    const duration = 1400
    const step = (ts: number) => {
      if (start === undefined) start = ts
      const prog = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - prog, 4)
      setCurrent(Math.round(value * ease))
      if (prog < 1) requestAnimationFrame(step)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [value])
  return <>{prefix}{current.toLocaleString('pt-BR')}{suffix}</>
}

// ══════════════════════════════════════════════════════════════
// TILT CARD
// ══════════════════════════════════════════════════════════════
function TiltCard({ children, className, style }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rX = useTransform(my, [-70, 70], [4, -4])
  const rY = useTransform(mx, [-70, 70], [-4, 4])
  const sX = useSpring(rX, { stiffness: 300, damping: 30 })
  const sY = useSpring(rY, { stiffness: 300, damping: 30 })
  return (
    <motion.div
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set(e.clientX - r.left - r.width / 2)
        my.set(e.clientY - r.top - r.height / 2)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
      style={{ rotateX: sX, rotateY: sY, transformPerspective: 900, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
// INPUT FIELD (auth forms)
// ══════════════════════════════════════════════════════════════
function AuthInput({
  label, type = 'text', value, onChange, icon: Icon, placeholder, rightEl,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  icon: React.ElementType
  placeholder?: string
  rightEl?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </label>
      <div className="relative flex items-center" style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${focused ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '12px',
        transition: 'border-color 0.2s',
        boxShadow: focused ? '0 0 20px rgba(212,175,55,0.08)' : 'none',
      }}>
        <Icon size={14} className="ml-3.5 flex-shrink-0" style={{ color: focused ? '#D4AF37' : 'rgba(113,113,122,0.5)', transition: 'color 0.2s' }} />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder-zinc-600"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        />
        {rightEl && <div className="mr-3 flex-shrink-0">{rightEl}</div>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// AUTH SCREEN
// ══════════════════════════════════════════════════════════════
function AuthScreen({ users, onAuth, onRegister }: {
  users: AppUser[]
  onAuth: (user: AppUser) => void
  onRegister: (user: AppUser) => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<UserRole>('client')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', specialty: '', barbershopName: '',
  })
  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const roleCards: { value: UserRole; label: string; icon: React.ElementType; desc: string; badge?: string }[] = [
    { value: 'client',  label: 'Cliente',      icon: User,           desc: 'Agende seu horário online com facilidade' },
    { value: 'barber',  label: 'Barbeiro',      icon: Scissors,       desc: 'Gerencie sua agenda e atendimentos' },
    { value: 'admin',   label: 'Proprietário',  icon: Crown,          desc: 'Controle total da barbearia', badge: 'ADM' },
  ]

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    if (mode === 'login') {
      const found = users.find(u => u.email === form.email && u.password === form.password && u.role === role)
      if (!found) { setError('E-mail, senha ou perfil incorretos.'); setLoading(false); return }
      onAuth(found)
    } else {
      if (!form.name || !form.email || !form.phone || !form.password) {
        setError('Preencha todos os campos obrigatórios.'); setLoading(false); return
      }
      if (users.find(u => u.email === form.email)) {
        setError('Este e-mail já está cadastrado.'); setLoading(false); return
      }
      const initials = form.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
      const newUser: AppUser = {
        id: Date.now().toString(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
        avatar: initials,
        specialty: role === 'barber' ? form.specialty : undefined,
        barbershopName: role === 'admin' ? form.barbershopName : undefined,
      }
      onRegister(newUser)
      onAuth(newUser)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-4 py-10"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AmbientBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(212,175,55,0.3)', '0 0 50px rgba(212,175,55,0.6)', '0 0 20px rgba(212,175,55,0.3)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <Scissors size={18} style={{ color: '#D4AF37' }} />
            </motion.div>
            <div className="text-left">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>
                LEGACY
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(113,113,122,0.5)', letterSpacing: '0.36em', marginTop: '2px' }}>
                BARBER
              </div>
            </div>
          </div>
          <p style={{ color: 'rgba(113,113,122,0.6)', fontSize: '13px' }}>
            {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          }}>

          {/* Mode tabs */}
          <div className="flex gap-0.5 p-1 rounded-2xl mb-6"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-200"
                style={{ color: mode === m ? '#D4AF37' : 'rgba(113,113,122,0.6)', zIndex: 1 }}>
                {mode === m && (
                  <motion.div layoutId="auth-tab"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.22)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 40 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {m === 'login' ? <LogIn size={13} /> : <UserPlus size={13} />}
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </span>
              </button>
            ))}
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
              Entrar como
            </p>
            <div className="grid grid-cols-3 gap-2">
              {roleCards.map(rc => {
                const Icon = rc.icon
                const sel = role === rc.value
                return (
                  <motion.button
                    key={rc.value}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setRole(rc.value); setError('') }}
                    className="relative flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all duration-200"
                    style={{
                      background: sel ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${sel ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: sel ? '0 0 30px rgba(212,175,55,0.12), inset 0 0 20px rgba(212,175,55,0.03)' : 'none',
                    }}>
                    {rc.badge && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        fontSize: '7px', fontWeight: 700, letterSpacing: '0.08em',
                        padding: '1px 5px', borderRadius: '4px',
                        background: 'rgba(212,175,55,0.14)', color: '#D4AF37',
                        border: '1px solid rgba(212,175,55,0.2)',
                      }}>{rc.badge}</div>
                    )}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{
                        background: sel ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${sel ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                      <Icon size={14} style={{ color: sel ? '#D4AF37' : 'rgba(113,113,122,0.6)' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: sel ? '#D4AF37' : 'rgba(161,161,170,0.65)' }}>
                      {rc.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div key={`${mode}-${role}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3">

              {mode === 'register' && (
                <AuthInput label="Nome completo" value={form.name} onChange={set('name')} icon={User} placeholder="Seu nome" />
              )}
              {mode === 'register' && role === 'admin' && (
                <AuthInput label="Nome da barbearia" value={form.barbershopName} onChange={set('barbershopName')} icon={Building2} placeholder="Ex: Legacy Barber" />
              )}
              {mode === 'register' && role === 'barber' && (
                <AuthInput label="Especialidade" value={form.specialty} onChange={set('specialty')} icon={Scissors} placeholder="Ex: Degradê, Barba Artística" />
              )}
              <AuthInput label="E-mail" type="email" value={form.email} onChange={set('email')} icon={Mail} placeholder="seu@email.com" />
              {mode === 'register' && (
                <AuthInput label="Telefone / WhatsApp" type="tel" value={form.phone} onChange={set('phone')} icon={Phone} placeholder="(11) 99999-0000" />
              )}
              <AuthInput
                label="Senha"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                icon={Lock}
                placeholder="••••••••"
                rightEl={
                  <button onClick={() => setShowPass(p => !p)} style={{ color: 'rgba(113,113,122,0.5)' }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-center py-2 px-3 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.01, boxShadow: '0 0 50px rgba(212,175,55,0.35)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2 mt-1"
                style={{
                  background: loading ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg, #B8951F, #D4AF37, #ECCb52)',
                  letterSpacing: '0.02em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={15} />
                  </motion.div>
                ) : (
                  <>
                    {mode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
                    {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                  </>
                )}
              </motion.button>

              {/* Demo hint */}
              {mode === 'login' && (() => {
                const hints: Record<UserRole, string> = {
                  admin:  'admin@legacy.com',
                  barber: 'carlos@legacy.com',
                  client: 'pedro@email.com',
                }
                return (
                  <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(113,113,122,0.38)', marginTop: '8px' }}>
                    Demo: <span style={{ color: 'rgba(212,175,55,0.5)' }}>{hints[role]}</span> / <span style={{ color: 'rgba(212,175,55,0.5)' }}>123456</span>
                  </p>
                )
              })()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// REVENUE CHART
// ══════════════════════════════════════════════════════════════
function RevenueChart() {
  const [hov, setHov] = useState<number | null>(null)
  const W = 600, H = 160
  const P = { t: 10, r: 20, b: 28, l: 10 }
  const iW = W - P.l - P.r
  const iH = H - P.t - P.b
  const max = Math.max(...REVENUE_DATA.map(d => d.value))
  const xOf = (i: number) => P.l + (i / (REVENUE_DATA.length - 1)) * iW
  const yOf = (v: number) => P.t + iH - (v / max) * iH * 0.88
  const pts = REVENUE_DATA.map((d, i) => ({ ...d, x: xOf(i), y: yOf(d.value) }))
  const line = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }, '')
  const fill = `${line} L ${pts.at(-1)!.x} ${H - P.b} L ${pts[0].x} ${H - P.b} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      <defs>
        <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"    />
        </linearGradient>
        <linearGradient id="lG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#7A5F18" />
          <stop offset="50%"  stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F0D060" />
        </linearGradient>
        <filter id="gF">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.33, 0.66, 1].map((t, i) => (
        <line key={i}
          x1={P.l} y1={P.t + iH * (1 - t * 0.88)}
          x2={W - P.r} y2={P.t + iH * (1 - t * 0.88)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <motion.path d={fill} fill="url(#aG)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} />
      <motion.path d={line} fill="none" stroke="url(#lG)" strokeWidth="2.5" filter="url(#gF)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }} />
      {pts.map((p, i) => (
        <g key={i}>
          <rect x={p.x - 22} y={P.t} width={44} height={iH} fill="transparent" style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          <motion.circle cx={p.x} cy={p.y}
            r={hov === i ? 5.5 : 3.5}
            fill={hov === i ? '#F0D060' : '#D4AF37'}
            stroke={hov === i ? 'rgba(212,175,55,0.35)' : 'transparent'} strokeWidth={hov === i ? 6 : 0}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 + i * 0.08 }}
            style={{ filter: hov === i ? 'drop-shadow(0 0 7px rgba(212,175,55,0.9))' : 'none' }} />
          {hov === i && (
            <g>
              <rect x={p.x - 40} y={p.y - 38} width={80} height={26} rx={6}
                fill="rgba(12,12,12,0.96)" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
              <text x={p.x} y={p.y - 21} textAnchor="middle"
                fill="#D4AF37" fontSize="11.5" fontFamily="DM Sans" fontWeight="700">
                R$ {p.value.toLocaleString('pt-BR')}
              </text>
            </g>
          )}
          <text x={p.x} y={H - 4} textAnchor="middle"
            fill="rgba(161,161,170,0.45)" fontSize="10" fontFamily="DM Sans">{p.day}</text>
        </g>
      ))}
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════
// STAT CARD
// ══════════════════════════════════════════════════════════════
function StatCard({ icon: Icon, label, numValue, prefix = '', suffix = '', featured = false }: {
  icon: React.ElementType; label: string; numValue: number
  prefix?: string; suffix?: string; featured?: boolean
}) {
  return (
    <TiltCard
      className="relative overflow-hidden rounded-2xl p-5 cursor-default"
      style={featured ? {
        background: 'rgba(212,175,55,0.07)',
        border: '1px solid rgba(212,175,55,0.22)',
        boxShadow: '0 0 40px rgba(212,175,55,0.07)',
      } : {
        background: 'rgba(255,255,255,0.022)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: featured ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.05)' }}>
        <Icon size={18} style={{ color: featured ? '#D4AF37' : 'rgba(113,113,122,0.9)' }} />
      </div>
      <div className="text-2xl font-bold mb-1"
        style={{ color: featured ? '#D4AF37' : 'white', fontFamily: "'DM Sans', sans-serif" }}>
        <AnimatedNumber value={numValue} prefix={prefix} suffix={suffix} />
      </div>
      <div style={{ fontSize: '10px', color: 'rgba(113,113,122,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
        {label}
      </div>
      {featured && (
        <ArrowUpRight size={13} style={{ position: 'absolute', top: 16, right: 16, color: 'rgba(212,175,55,0.35)' }} />
      )}
    </TiltCard>
  )
}

// ══════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════
function Sidebar({ user, activeTab, setActiveTab, onLogout }: {
  user: AppUser; activeTab: string; setActiveTab: (t: string) => void; onLogout: () => void
}) {
  const navMap: Record<UserRole, { id: string; label: string; icon: React.ElementType }[]> = {
    client: [
      { id: 'agenda',       label: 'Agendar',           icon: Calendar      },
      { id: 'agendamentos', label: 'Meus Agendamentos', icon: Clock         },
      { id: 'perfil',       label: 'Perfil',            icon: User          },
    ],
    barber: [
      { id: 'agenda',  label: 'Agenda',  icon: Calendar },
      { id: 'insumos', label: 'Insumos', icon: Package  },
      { id: 'perfil',  label: 'Perfil',  icon: User     },
    ],
    admin: [
      { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
      { id: 'estoque',    label: 'Estoque',    icon: Package         },
      { id: 'equipe',     label: 'Equipe',     icon: Users           },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart2       },
    ],
  }

  return (
    <aside className="w-[220px] flex flex-col h-screen sticky top-0" style={{
      background: 'rgba(5,5,5,0.9)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)' }}>
            <Scissors size={13} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>
              LEGACY
            </div>
            <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.5)', letterSpacing: '0.32em', marginTop: '2px' }}>
              BARBER
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        {navMap[user.role].map(item => {
          const Icon = item.icon
          const active = activeTab === item.id
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium relative transition-colors duration-150"
              style={{ color: active ? '#D4AF37' : 'rgba(113,113,122,0.75)' }}>
              {active && (
                <motion.div layoutId="na"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'rgba(212,175,55,0.06)',
                    border: '1px solid rgba(212,175,55,0.16)',
                    boxShadow: 'inset 0 0 20px rgba(212,175,55,0.04)',
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 40 }}
                />
              )}
              <Icon size={15} className="relative z-10 flex-shrink-0" />
              <span className="relative z-10">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-2.5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: 'rgba(212,175,55,0.09)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.18)' }}>
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600 }} className="truncate">
              {user.name.split(' ')[0]}
            </div>
            <div style={{ color: 'rgba(113,113,122,0.55)', fontSize: '10px', textTransform: 'capitalize' }}>
              {user.role === 'admin' ? 'Proprietário' : user.role === 'barber' ? 'Barbeiro' : 'Cliente'}
            </div>
          </div>
          <motion.button
            whileHover={{ color: '#f87171', scale: 1.1 }}
            onClick={onLogout}
            style={{ color: 'rgba(113,113,122,0.4)', flexShrink: 0 }}
            title="Sair">
            <LogOut size={14} />
          </motion.button>
        </div>
      </div>
    </aside>
  )
}

// ══════════════════════════════════════════════════════════════
// CLIENT VIEW
// ══════════════════════════════════════════════════════════════
function ClientView({ user }: { user: AppUser }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selService, setSelService] = useState<typeof SERVICES[0] | null>(null)
  const [selBarber,  setSelBarber]  = useState<typeof BARBERS[0]  | null>(null)
  const [selTime,    setSelTime]    = useState<string | null>(null)
  const [selDate,    setSelDate]    = useState(() => new Date().toISOString().split('T')[0])
  const [confirmed,  setConfirmed]  = useState(false)

  const canNext =
    (step === 1 && !!selService) ||
    (step === 2 && !!selBarber)  ||
    (step === 3 && !!selDate && !!selTime)

  const prev = () => step > 1 && setStep((step - 1) as 1 | 2 | 3 | 4)
  const next = () => canNext && setStep((step + 1) as 2 | 3 | 4)
  const reset = () => { setConfirmed(false); setStep(1); setSelService(null); setSelBarber(null); setSelTime(null) }

  const steps = [
    { n: 1, label: 'Serviço'     },
    { n: 2, label: 'Profissional'},
    { n: 3, label: 'Data & Hora' },
    { n: 4, label: 'Confirmação' },
  ]

  if (confirmed) return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center max-w-md mx-auto py-16">
      <motion.div
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
        className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)', boxShadow: '0 0 70px rgba(212,175,55,0.22)' }}>
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
        {[
          ['Serviço',  selService?.name],
          ['Barbeiro', selBarber?.name],
          ['Data',     selDate],
          ['Horário',  selTime],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between items-center py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
          Olá, {user.name.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
          Faça seu agendamento em minutos
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-10">
        <div className="flex items-center">
          {steps.map((s, idx) => (
            <div key={s.n} className="flex items-center" style={{ flex: idx < steps.length - 1 ? 1 : 'none' }}>
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
                <span style={{
                  fontSize: '10px', fontWeight: 500, whiteSpace: 'nowrap',
                  color: step === s.n ? '#D4AF37' : step > s.n ? 'rgba(161,161,170,0.7)' : 'rgba(113,113,122,0.45)',
                }}>{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
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
          <motion.div key="s1"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
              Qual serviço você deseja?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map((sv, idx) => {
                const sel = selService?.id === sv.id
                return (
                  <motion.button key={sv.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelService(sv)}
                    className="relative text-left rounded-2xl p-5 transition-all duration-200"
                    style={{
                      background: sel ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.022)',
                      border: `1px solid ${sel ? 'rgba(212,175,55,0.42)' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: sel ? '0 0 35px rgba(212,175,55,0.12)' : 'none',
                    }}>
                    {sv.popular && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10, fontSize: '9px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px',
                        borderRadius: '9999px', background: 'rgba(212,175,55,0.14)',
                        color: '#D4AF37', border: '1px solid rgba(212,175,55,0.22)',
                      }}>Popular</div>
                    )}
                    <div style={{ fontSize: '22px', marginBottom: '10px' }}>{sv.emoji}</div>
                    <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginBottom: '6px', lineHeight: 1.3 }}>
                      {sv.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(113,113,122,0.7)', fontSize: '12px', marginBottom: '10px' }}>
                      <Clock size={11} />{sv.duration}
                    </div>
                    <div style={{ color: sel ? '#D4AF37' : 'rgba(138,111,32,0.9)', fontWeight: 700, fontSize: '18px' }}>
                      R$ {sv.price}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
              Escolha seu profissional
            </h2>
            <div className="space-y-3">
              {BARBERS.map((b, idx) => {
                const sel = selBarber?.id === b.id
                return (
                  <motion.button key={b.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
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
                        style={{
                          background: sel ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                          color: sel ? '#D4AF37' : 'rgba(113,113,122,0.8)',
                          border: sel ? '1px solid rgba(212,175,55,0.28)' : '1px solid rgba(255,255,255,0.07)',
                        }}>{b.avatar}</div>
                      {b.available && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500"
                          style={{ border: '2px solid #050505' }} />
                      )}
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
          <motion.div key="s3"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
              Quando você prefere?
            </h2>
            <div className="mb-6">
              <label style={{ fontSize: '11px', color: 'rgba(113,113,122,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                Data
              </label>
              <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'rgba(113,113,122,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>
                Horário
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((t, idx) => {
                  const sel = selTime === t
                  return (
                    <motion.button key={t}
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.035 }}
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
          <motion.div key="s4"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '24px' }}>
              Confirmar Agendamento
            </h2>
            <div className="rounded-2xl overflow-hidden mb-6"
              style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.045)' }}>
                <div className="flex items-center gap-2">
                  <Scissors size={13} style={{ color: '#D4AF37' }} />
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", color: '#D4AF37', fontWeight: 600, fontSize: '15px' }}>
                    LEGACY BARBER
                  </span>
                </div>
                <BadgeCheck size={15} style={{ color: '#D4AF37' }} />
              </div>
              <div className="px-6 py-5 space-y-3.5">
                {[
                  ['Cliente',  user.name],
                  ['Serviço',  selService?.name],
                  ['Barbeiro', selBarber?.name],
                  ['Data',     selDate],
                  ['Horário',  selTime],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
                  <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '22px' }}>R$ {selService?.price}</span>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.01, boxShadow: '0 0 50px rgba(212,175,55,0.35)' }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setConfirmed(true)}
              className="w-full py-3.5 rounded-xl font-semibold text-black text-sm"
              style={{ background: 'linear-gradient(135deg, #B8951F, #D4AF37, #ECCb52)', letterSpacing: '0.02em' }}>
              Confirmar Agendamento
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
            whileHover={canNext ? { scale: 1.03 } : {}}
            whileTap={canNext ? { scale: 0.97 } : {}}
            onClick={next} disabled={!canNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: canNext ? 'linear-gradient(135deg, #B8951F, #D4AF37)' : 'rgba(255,255,255,0.05)',
              color: canNext ? '#000' : 'rgba(113,113,122,0.38)',
              boxShadow: canNext ? '0 0 24px rgba(212,175,55,0.22)' : 'none',
              cursor: canNext ? 'pointer' : 'not-allowed',
              letterSpacing: '0.02em',
            }}>
            Continuar <ChevronRight size={15} />
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ADMIN VIEW
// ══════════════════════════════════════════════════════════════
function AdminView({ user }: { user: AppUser }) {
  const [inv, setInv] = useState(INVENTORY)
  const use1 = (id: number) => setInv(p => p.map(i => i.id === id ? { ...i, stock: Math.max(0, i.stock - 1) } : i))
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Faturamento Hoje" numValue={1240}  prefix="R$ " featured />
        <StatCard icon={TrendingUp} label="Faturamento Mês"  numValue={28650} prefix="R$ " />
        <StatCard icon={Users}      label="Clientes Hoje"    numValue={8}     suffix=" atend." />
        <StatCard icon={Activity}   label="Ocupação"         numValue={78}    suffix="%" />
      </div>

      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px' }}>
              Receita — Últimos 7 Dias
            </h3>
            <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '12px', marginTop: '2px' }}>Total: R$ 13.200</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#4ade80' }}>
            <ArrowUpRight size={13} />+24% vs semana anterior
          </div>
        </div>
        <RevenueChart />
      </div>

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

// ══════════════════════════════════════════════════════════════
// BARBER VIEW
// ══════════════════════════════════════════════════════════════
function BarberView({ user }: { user: AppUser }) {
  const [inv, setInv] = useState(INVENTORY)
  const use1 = (id: number) => setInv(p => p.map(i => i.id === id ? { ...i, stock: Math.max(0, i.stock - 1) } : i))
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-8">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
          {greeting}, {user.name.split(' ')[0]}
        </h1>
        <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
          {today.charAt(0).toUpperCase() + today.slice(1)}
          {user.specialty && <span style={{ color: 'rgba(212,175,55,0.5)', marginLeft: '8px' }}>· {user.specialty}</span>}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <TiltCard className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Atendimentos</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>6</div>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '2px' }}>hoje</div>
          </TiltCard>
          <TiltCard className="rounded-xl p-4"
            style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', boxShadow: '0 0 30px rgba(212,175,55,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Faturamento</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#D4AF37' }}>R$ 520</div>
            <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '2px' }}>hoje</div>
          </TiltCard>
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
          Agenda de Hoje
        </h2>
        <div className="space-y-2 relative">
          <div className="absolute left-[21px] top-3 bottom-3 w-px"
            style={{ background: 'linear-gradient(to bottom, rgba(212,175,55,0.14), rgba(255,255,255,0.03))' }} />
          {AGENDA_HOJE.map((slot, idx) => (
            <motion.div key={idx}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              className="flex items-center gap-3 relative"
              style={{ opacity: slot.status === 'done' ? 0.42 : 1 }}>
              <div className="w-11 flex justify-center flex-shrink-0 relative z-10">
                {slot.status === 'current' ? (
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="absolute w-3.5 h-3.5 rounded-full"
                      style={{ background: '#D4AF37' }} />
                    <div className="w-3.5 h-3.5 rounded-full"
                      style={{ background: '#D4AF37', boxShadow: '0 0 14px rgba(212,175,55,0.85)', position: 'relative' }} />
                  </div>
                ) : slot.status === 'done' ? (
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.4)' }}>
                    <Check size={8} style={{ color: '#4ade80' }} />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                )}
              </div>
              <div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: slot.status === 'current' ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.022)',
                  border: `1px solid ${slot.status === 'current' ? 'rgba(212,175,55,0.22)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                <span className="font-mono text-xs font-bold flex-shrink-0"
                  style={{ color: slot.status === 'current' ? '#D4AF37' : 'rgba(113,113,122,0.55)', minWidth: '40px' }}>
                  {slot.time}
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontSize: '13px' }} className="truncate">{slot.client}</div>
                  <div style={{ color: 'rgba(113,113,122,0.6)', fontSize: '12px' }} className="truncate">{slot.service}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: slot.status === 'current' ? 'rgba(212,175,55,0.12)' : slot.status === 'done' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                    color: slot.status === 'current' ? '#D4AF37' : slot.status === 'done' ? '#4ade80' : 'rgba(113,113,122,0.65)',
                    border: `1px solid ${slot.status === 'current' ? 'rgba(212,175,55,0.22)' : slot.status === 'done' ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {slot.status === 'done' ? 'Concluído' : slot.status === 'current' ? 'Em andamento' : 'Próximo'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
          Baixa Rápida de Insumo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {inv.map((item, idx) => {
            const pct = (item.stock / item.max) * 100
            const barColor = pct <= 25 ? '#ef4444' : pct <= 50 ? '#f59e0b' : '#D4AF37'
            return (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '10px', color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {item.category}
                </div>
                <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontSize: '13px', marginBottom: '10px', lineHeight: 1.3 }}>
                  {item.name}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span style={{ fontSize: '20px', fontWeight: 700, color: pct <= 25 ? '#f87171' : '#D4AF37' }}>{item.stock}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)' }}>/ {item.max} {item.unit}</span>
                </div>
                <div className="rounded-full overflow-hidden mb-3" style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: '9999px', background: barColor }} />
                </div>
                <button onClick={() => use1(item.id)}
                  className="w-full py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(113,113,122,0.65)' }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(239,68,68,0.42)'; b.style.color = '#f87171'; b.style.background = 'rgba(239,68,68,0.06)' }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.07)'; b.style.color = 'rgba(113,113,122,0.65)'; b.style.background = 'transparent' }}>
                  Usar 1 unidade
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [users, setUsers]         = useState<AppUser[]>(MOCK_USERS)
  const [currentUser, setUser]    = useState<AppUser | null>(null)
  const [tab, setTab]             = useState('agenda')
  const [mobileOpen, setMobile]   = useState(false)

  const login = (u: AppUser) => {
    setUser(u)
    setTab(u.role === 'admin' ? 'dashboard' : 'agenda')
  }
  const logout = () => { setUser(null); setMobile(false) }
  const addUser = (u: AppUser) => setUsers(p => [...p, u])

  // ── Not authenticated ──────────────────────────────────────
  if (!currentUser) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#050505', minHeight: '100vh' }}>
      <AuthScreen users={users} onAuth={login} onRegister={addUser} />
    </div>
  )

  // ── Authenticated ──────────────────────────────────────────
  return (
    <div className="min-h-screen text-white relative"
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#050505' }}>
      <AmbientBackground />

      {/* Mobile header */}
      <header className="md:hidden relative z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(22px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)' }}>
            <Scissors size={12} style={{ color: '#D4AF37' }} />
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 700, color: '#D4AF37' }}>
            LEGACY
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold"
              style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}>
              {currentUser.avatar}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(212,175,55,0.8)' }}>
              {currentUser.name.split(' ')[0]}
            </span>
          </div>
          <button onClick={() => setMobile(o => !o)} style={{ color: 'rgba(113,113,122,0.7)' }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="md:hidden relative z-40 px-4 py-3 space-y-1"
            style={{ background: 'rgba(7,7,7,0.96)', backdropFilter: 'blur(22px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { id: currentUser.role === 'admin' ? 'dashboard' : 'agenda', label: currentUser.role === 'admin' ? 'Dashboard' : 'Agenda', Icon: currentUser.role === 'admin' ? LayoutDashboard : Calendar },
              { id: 'perfil', label: 'Perfil', Icon: User },
            ].map(item => (
              <button key={item.id}
                onClick={() => { setTab(item.id); setMobile(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={{ color: 'rgba(161,161,170,0.7)' }}>
                <item.Icon size={14} />{item.label}
              </button>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: 'rgba(239,68,68,0.6)' }}>
              <LogOut size={14} />Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop layout */}
      <div className="flex relative z-10" style={{ minHeight: '100vh' }}>
        <div className="hidden md:block flex-shrink-0">
          <Sidebar user={currentUser} activeTab={tab} setActiveTab={setTab} onLogout={logout} />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6 md:py-8">
            <AnimatePresence mode="wait">
              {currentUser.role === 'client' && (
                <motion.div key="cv"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}>
                  <ClientView user={currentUser} />
                </motion.div>
              )}
              {currentUser.role === 'admin' && (
                <motion.div key="av"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}>
                  <AdminView user={currentUser} />
                </motion.div>
              )}
              {currentUser.role === 'barber' && (
                <motion.div key="bv"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}>
                  <BarberView user={currentUser} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
