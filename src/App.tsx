import { useState, useEffect } from 'react'
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
  Zap, MessageCircle, ArrowRight, Shield,
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
// LANDING DATA
// ══════════════════════════════════════════════════════════════
const LANDING_FEATURES = [
  { icon: Calendar,       title: 'Agendamento Online',      desc: 'Clientes agendam 24/7 pelo celular, sem telefonema. Confirmação automática.' },
  { icon: Users,          title: 'Gestão de Equipe',        desc: 'Agenda e desempenho individual por barbeiro. Cada profissional vê sua rota.' },
  { icon: Package,        title: 'Controle de Estoque',     desc: 'Alertas quando produtos acabam. Histórico de uso e baixa rápida por item.' },
  { icon: BarChart2,      title: 'Relatórios Avançados',    desc: 'Faturamento, ticket médio, ocupação — dados que viram decisões inteligentes.' },
  { icon: MessageCircle,  title: 'Notificações WhatsApp',   desc: 'Lembretes automáticos reduzem no-show em até 80%. Zero esforço manual.' },
  { icon: Zap,            title: 'Automação Total',         desc: 'Workflows inteligentes cuidam do operacional enquanto você foca no cliente.' },
]

const TESTIMONIALS_DATA = [
  { name: 'Ricardo Borges', shop: 'Borges Barber · São Paulo',       avatar: 'RB', text: 'Reduzimos 80% dos no-shows com os lembretes automáticos. O sistema se pagou no primeiro mês.' },
  { name: 'André Lemos',    shop: 'Studio Lemos · Belo Horizonte',   avatar: 'AL', text: 'A visibilidade financeira é incrível. Sei exatamente quanto entrou e saiu a cada dia.' },
  { name: 'Marcos Teles',   shop: 'Teles Premium · Rio de Janeiro',  avatar: 'MT', text: 'Cada barbeiro tem sua própria visão da agenda. Acabou a confusão e o retrabalho na equipe.' },
]

const PRICING_DATA = [
  {
    name: 'Básico', price: 'Grátis', period: '',      recommended: false,
    features: ['1 barbeiro', '50 agendamentos/mês', 'Agendamento online', 'Dashboard básico'],
    cta: 'Começar Grátis',
  },
  {
    name: 'Pro',    price: 'R$ 97', period: '/mês',   recommended: true,
    features: ['Até 5 barbeiros', 'Agendamentos ilimitados', 'Notificações WhatsApp', 'Relatórios completos', 'Controle de estoque', 'Suporte prioritário'],
    cta: 'Começar Agora',
  },
  {
    name: 'Business', price: 'R$ 197', period: '/mês', recommended: false,
    features: ['Barbeiros ilimitados', 'Multi-unidades', 'API de integração', 'Gestor dedicado', 'SLA 99.9%', 'Onboarding personalizado'],
    cta: 'Falar com Vendas',
  },
]

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 17 + 11) % 84}%`,
  top:  `${4 + (i * 23 + 7)  % 92}%`,
  size: 1.4 + (i % 4) * 0.5,
  dur:  7   + (i % 5) * 1.8,
  delay: i  * 0.38,
  amp:  14  + (i % 4) * 8,
}))

// ══════════════════════════════════════════════════════════════
// TECH GRID + PARTICLES
// ══════════════════════════════════════════════════════════════
function TechGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.035 }}>
        <defs>
          <pattern id="tg" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M 52 0 L 0 0 0 52" fill="none" stroke="rgba(212,175,55,1)" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tg)" />
      </svg>
      <motion.div
        animate={{ x: ['-2%', '102%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        className="absolute inset-y-0 w-px opacity-20"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.6), transparent)' }}
      />
    </div>
  )
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: 'rgba(212,175,55,0.5)' }}
          animate={{ y: [0, -p.amp, 0], opacity: [0.15, 0.65, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

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
// MINI CHART (hero mockup)
// ══════════════════════════════════════════════════════════════
function MiniChart() {
  const data = [42, 68, 51, 85, 96, 112, 78]
  const max = Math.max(...data)
  const W = 260, H = 55
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - (v / max) * H * 0.82 }))
  const line = pts.reduce((a, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const cx = (pts[i-1].x + p.x) / 2
    return `${a} C ${cx} ${pts[i-1].y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }, '')
  const fill = `${line} L ${pts.at(-1)!.x} ${H} L ${pts[0].x} ${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 55 }}>
      <defs>
        <linearGradient id="mcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <motion.path d={fill} fill="url(#mcFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}/>
      <motion.path d={line} fill="none" stroke="#D4AF37" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}/>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD MOCKUP (hero right side)
// ══════════════════════════════════════════════════════════════
function DashboardMockup() {
  return (
    <TiltCard className="rounded-2xl overflow-hidden relative" style={{
      background: 'rgba(7,7,7,0.93)',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 0 80px rgba(212,175,55,0.07)',
    }}>
      {/* chrome */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.012)' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            {['rgba(239,68,68,0.7)','rgba(245,158,11,0.7)','rgba(34,197,94,0.7)'].map((c,i)=>(
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }}/>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Scissors size={9} style={{ color: '#D4AF37' }}/>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.6)', fontFamily: "'DM Sans',sans-serif" }}>Legacy Barber — Dashboard</span>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Faturamento', value: 'R$ 1.240', gold: true  },
            { label: 'Clientes',    value: '8 hoje',   gold: false },
            { label: 'Ocupação',    value: '78%',      gold: false },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
              className="rounded-xl p-2.5"
              style={{ background: s.gold ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.gold ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
              <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{s.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: s.gold ? '#D4AF37' : 'rgba(255,255,255,0.85)' }}>{s.value}</div>
            </motion.div>
          ))}
        </div>
        {/* chart */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '9px', color: 'rgba(113,113,122,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Receita Semanal</span>
            <span style={{ fontSize: '9px', color: '#4ade80', fontWeight: 600 }}>↑ +24%</span>
          </div>
          <MiniChart/>
        </div>
        {/* schedule */}
        <div>
          <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Próximos Agendamentos</div>
          <div className="space-y-1.5">
            {[
              { time: '14:00', name: 'Pedro A.',   service: 'Corte + Barba',   now: true  },
              { time: '14:45', name: 'Rodrigo N.', service: 'Corte Clássico',  now: false },
              { time: '15:30', name: 'Felipe S.',  service: 'Barba Completa',  now: false },
            ].map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.08 }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2"
                style={{ background: a.now ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${a.now ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)'}` }}>
                <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: a.now ? '#D4AF37' : 'rgba(113,113,122,0.5)', minWidth: '30px' }}>{a.time}</span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{a.name}</div>
                  <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.5)' }}>{a.service}</div>
                </div>
                {a.now && (
                  <div className="flex items-center gap-1">
                    <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }}/>
                    <span style={{ fontSize: '8px', color: '#D4AF37', fontWeight: 600 }}>Agora</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(7,7,7,0.8), transparent)' }}/>
    </TiltCard>
  )
}

// ══════════════════════════════════════════════════════════════
// AUTH FORM (used inside modal)
// ══════════════════════════════════════════════════════════════
function AuthForm({ users, onAuth, onRegister, initialMode = 'login' }: {
  users: AppUser[]
  onAuth: (user: AppUser) => void
  onRegister: (user: AppUser) => void
  initialMode?: 'login' | 'register'
}) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
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
    <div className="rounded-3xl p-6"
      style={{
        background: 'rgba(8,8,8,0.97)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
      }}>
      {/* Logo inside modal */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{ boxShadow: ['0 0 16px rgba(212,175,55,0.25)', '0 0 36px rgba(212,175,55,0.55)', '0 0 16px rgba(212,175,55,0.25)'] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)' }}>
          <Scissors size={15} style={{ color: '#D4AF37' }} />
        </motion.div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>LEGACY</div>
          <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.45)', letterSpacing: '0.36em' }}>BARBER</div>
        </div>
        <p className="ml-auto" style={{ color: 'rgba(113,113,122,0.55)', fontSize: '12px' }}>
          {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </p>
      </div>

      <div>

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
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// AUTH MODAL
// ══════════════════════════════════════════════════════════════
function AuthModal({ open, onClose, initialMode = 'login', users, onAuth, onRegister }: {
  open: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  users: AppUser[]
  onAuth: (user: AppUser) => void
  onRegister: (user: AppUser) => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', background: 'rgba(0,0,0,0.72)' }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto relative w-full max-w-md"
            >
              <button onClick={onClose}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(113,113,122,0.7)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(113,113,122,0.7)' }}>
                <X size={14}/>
              </button>
              <AuthForm key={`${String(open)}-${initialMode}`} users={users} onAuth={onAuth} onRegister={onRegister} initialMode={initialMode}/>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING — NAVBAR
// ══════════════════════════════════════════════════════════════
type OpenAuthFn = (mode?: 'login' | 'register') => void

function LandingNav({ onOpenAuth }: { onOpenAuth: OpenAuthFn }) {
  const [scrolled, setScrolled] = useState(false)
  const [mob, setMob] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMob(false) }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 pt-3 pb-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-5 py-3"
        style={{
          background: scrolled ? 'rgba(5,5,5,0.92)' : 'rgba(5,5,5,0.5)',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          border: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.45)' : 'none',
          transition: 'all 0.3s ease',
        }}>
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <Scissors size={13} style={{ color: '#D4AF37' }}/>
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>LEGACY</div>
            <div style={{ fontSize: '7px', color: 'rgba(113,113,122,0.45)', letterSpacing: '0.36em' }}>BARBER</div>
          </div>
        </button>
        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7">
          {[['Recursos','features'],['Como Funciona','how-it-works'],['Preços','pricing']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'rgba(113,113,122,0.7)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D4AF37' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(113,113,122,0.7)' }}>
              {label}
            </button>
          ))}
        </div>
        {/* Auth buttons */}
        <div className="flex items-center gap-2.5">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAuth('login')}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.7)' }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(212,175,55,0.25)'; b.style.color = '#D4AF37' }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.07)'; b.style.color = 'rgba(161,161,170,0.7)' }}>
            <LogIn size={13}/> Entrar
          </motion.button>
          <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(212,175,55,0.38)' }} whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAuth('register')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-black"
            style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', letterSpacing: '0.01em' }}>
            <UserPlus size={13}/> Começar Grátis
          </motion.button>
          <button className="md:hidden" onClick={() => setMob(o => !o)} style={{ color: 'rgba(113,113,122,0.7)' }}>
            {mob ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      <AnimatePresence>
        {mob && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="md:hidden max-w-6xl mx-auto mt-2 rounded-2xl px-5 py-4 space-y-1"
            style={{ background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[['Recursos','features'],['Como Funciona','how-it-works'],['Preços','pricing']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{ color: 'rgba(161,161,170,0.7)' }}>
                {label}
              </button>
            ))}
            <div className="pt-2 flex gap-2">
              <button onClick={() => { onOpenAuth('login'); setMob(false) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center"
                style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(161,161,170,0.7)' }}>
                Entrar
              </button>
              <button onClick={() => { onOpenAuth('register'); setMob(false) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black text-center"
                style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)' }}>
                Começar Grátis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING — HERO
// ══════════════════════════════════════════════════════════════
function HeroSection({ onOpenAuth }: { onOpenAuth: OpenAuthFn }) {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 px-4 md:px-8 overflow-hidden">
      <AmbientBackground/>
      <TechGrid/>
      <FloatingParticles/>
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7"
              style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <motion.div animate={{ scale: [1,1.4,1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }}/>
              <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' }}>SISTEMA 2025 · NOVO</span>
            </motion.div>

            <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {[
                { text: 'Gestão de',   color: 'white'   },
                { text: 'Barbearia',   color: 'gold'    },
                { text: 'de Elite.',   color: 'white'   },
              ].map((line, i) => (
                <motion.span key={i} style={{ display: 'block', fontSize: 'clamp(42px,5.5vw,76px)', fontWeight: 700, lineHeight: 1.05,
                  ...(line.color === 'gold' ? {
                    background: 'linear-gradient(135deg,#9A7D21 0%,#D4AF37 45%,#F0D060 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  } : { color: 'white' })
                }}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.12, duration: 0.75, ease: [0.16,1,0.3,1] }}>
                  {line.text}
                </motion.span>
              ))}
            </h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.52 }}
              className="mt-6 text-base leading-relaxed" style={{ color: 'rgba(113,113,122,0.72)', maxWidth: '470px' }}>
              Agendamento inteligente, controle total de equipe e estoque, relatórios em tempo real. Tudo em um sistema feito para barbearias que buscam excelência.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.62 }}
              className="flex flex-wrap gap-3 mt-8">
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(212,175,55,0.42)' }} whileTap={{ scale: 0.97 }}
                onClick={() => onOpenAuth('register')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-black text-sm"
                style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', letterSpacing: '0.02em' }}>
                Começar Gratuitamente <ArrowRight size={15}/>
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(161,161,170,0.75)' }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(212,175,55,0.35)'; b.style.color = '#D4AF37' }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(161,161,170,0.75)' }}>
                Ver Recursos
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.9 }}
              className="flex items-center gap-8 mt-10">
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confiado por</span>
              {[['1.200+','Barbearias'],['50k+','Agendamentos'],['98%','Satisfação']].map(([v,l],i)=>(
                <div key={i}>
                  <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: '18px', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)', marginTop: '2px' }}>{l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — mockup */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16,1,0.3,1] }}
            className="hidden md:block">
            <motion.div animate={{ y: [0,-10,0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
              <DashboardMockup/>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING — FEATURES
// ══════════════════════════════════════════════════════════════
function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <Shield size={11} style={{ color: '#D4AF37' }}/>
            <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' }}>RECURSOS</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
            Tudo que sua barbearia precisa
          </h2>
          <p style={{ color: 'rgba(113,113,122,0.6)', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
            Do agendamento ao financeiro, uma plataforma completa para barbearias profissionais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANDING_FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.08 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative rounded-2xl p-6 cursor-default group"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.25s, box-shadow 0.25s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(212,175,55,0.3)'; el.style.boxShadow = '0 0 40px rgba(212,175,55,0.08)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.boxShadow = 'none' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.16)', transition: 'background 0.25s, box-shadow 0.25s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(212,175,55,0.16)'; el.style.boxShadow = '0 0 20px rgba(212,175,55,0.2)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = 'rgba(212,175,55,0.08)'; el.style.boxShadow = 'none' }}>
                  <Icon size={18} style={{ color: '#D4AF37' }}/>
                </div>
                <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '15px', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: 'rgba(113,113,122,0.65)', fontSize: '13px', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING — STATS
// ══════════════════════════════════════════════════════════════
function StatsSection() {
  const stats = [
    { value: 1200, suffix: '+', label: 'Barbearias Ativas',    prefix: '' },
    { value: 50,   suffix: 'k+', label: 'Agendamentos/mês',   prefix: '' },
    { value: 2,    suffix: 'M+', label: 'Gerenciados',        prefix: 'R$ ' },
    { value: 98,   suffix: '%',  label: 'Clientes Satisfeitos', prefix: '' },
  ]
  return (
    <section className="relative py-16 px-4 md:px-8 overflow-hidden"
      style={{ background: 'rgba(212,175,55,0.025)', borderTop: '1px solid rgba(212,175,55,0.08)', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
      <TechGrid/>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>
                {s.prefix}<AnimatedNumber value={s.value}/>{s.suffix}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(113,113,122,0.6)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING — HOW IT WORKS
// ══════════════════════════════════════════════════════════════
function HowItWorksSection() {
  const steps = [
    { n: '01', icon: Building2,  title: 'Cadastre sua barbearia',   desc: 'Crie sua conta e configure o perfil da barbearia em menos de 5 minutos.' },
    { n: '02', icon: Users,      title: 'Convide sua equipe',        desc: 'Adicione barbeiros com perfis individuais. Cada um acessa sua própria agenda.' },
    { n: '03', icon: CheckCircle,title: 'Comece a receber',          desc: 'Seus clientes já podem agendar online. Você gerencia tudo em um painel.' },
  ]
  return (
    <section id="how-it-works" className="py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <Zap size={11} style={{ color: '#D4AF37' }}/>
            <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' }}>COMO FUNCIONA</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: 'white' }}>
            Pronto em 3 passos simples
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px"
            style={{ background: 'linear-gradient(to right, rgba(212,175,55,0.15), rgba(212,175,55,0.35), rgba(212,175,55,0.15))' }}/>
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.14 }}
                whileHover={{ y: -4 }}
                className="relative text-center rounded-2xl p-8"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 relative"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Icon size={22} style={{ color: '#D4AF37' }}/>
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', fontSize: '9px', fontWeight: 700, color: '#D4AF37', fontFamily: 'monospace' }}>
                    {s.n}
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ color: 'rgba(113,113,122,0.65)', fontSize: '13px', lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING — TESTIMONIALS
// ══════════════════════════════════════════════════════════════
function TestimonialsSection() {
  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            O que dizem nossos clientes
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS_DATA.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.25s, box-shadow 0.25s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(212,175,55,0.25)'; el.style.boxShadow = '0 0 40px rgba(212,175,55,0.06)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.boxShadow = 'none' }}>
              <div className="flex mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={13} fill="#D4AF37" style={{ color: '#D4AF37' }}/>
                ))}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontSize: '13px' }}>{t.name}</div>
                  <div style={{ color: 'rgba(113,113,122,0.5)', fontSize: '11px', marginTop: '1px' }}>{t.shop}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING — PRICING
// ══════════════════════════════════════════════════════════════
function PricingSection({ onOpenAuth }: { onOpenAuth: OpenAuthFn }) {
  return (
    <section id="pricing" className="py-24 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <Star size={11} style={{ color: '#D4AF37' }}/>
            <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 600, letterSpacing: '0.06em' }}>PREÇOS</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
            Simples e transparente
          </h2>
          <p style={{ color: 'rgba(113,113,122,0.6)', fontSize: '15px' }}>Sem taxas ocultas. Cancele quando quiser.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5 items-center">
          {PRICING_DATA.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.65, delay: i * 0.1 }}
              whileHover={{ y: plan.recommended ? -6 : -4, scale: plan.recommended ? 1.02 : 1.01 }}
              className={`relative rounded-2xl p-7 ${plan.recommended ? 'md:-my-4' : ''}`}
              style={{
                background: plan.recommended ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.022)',
                border: `1px solid ${plan.recommended ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: plan.recommended ? '0 0 60px rgba(212,175,55,0.12)' : 'none',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => { if (!plan.recommended) { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(212,175,55,0.2)'; el.style.boxShadow = '0 0 30px rgba(212,175,55,0.06)' }}}
              onMouseLeave={e => { if (!plan.recommended) { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.boxShadow = 'none' }}}>
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-black"
                  style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  MAIS POPULAR
                </div>
              )}
              <div style={{ fontSize: '12px', fontWeight: 700, color: plan.recommended ? '#D4AF37' : 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
                {plan.name}
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '42px', fontWeight: 700, color: plan.recommended ? '#D4AF37' : 'white', lineHeight: 1 }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: '14px', color: 'rgba(113,113,122,0.6)' }}>{plan.period}</span>}
              </div>
              <div className="space-y-3 mb-7">
                {plan.features.map((feat, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: plan.recommended ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)' }}>
                      <Check size={9} style={{ color: plan.recommended ? '#D4AF37' : 'rgba(161,161,170,0.7)' }}/>
                    </div>
                    <span style={{ fontSize: '13px', color: plan.recommended ? 'rgba(255,255,255,0.8)' : 'rgba(161,161,170,0.65)' }}>{feat}</span>
                  </div>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.03, boxShadow: plan.recommended ? '0 0 40px rgba(212,175,55,0.4)' : undefined }} whileTap={{ scale: 0.97 }}
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={plan.recommended
                  ? { background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', color: '#000', letterSpacing: '0.02em' }
                  : { border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(161,161,170,0.75)', background: 'transparent', transition: 'border-color 0.2s, color 0.2s' }}
                onMouseEnter={e => { if (!plan.recommended) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(212,175,55,0.3)'; b.style.color = '#D4AF37' }}}
                onMouseLeave={e => { if (!plan.recommended) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.09)'; b.style.color = 'rgba(161,161,170,0.75)' }}}>
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING — CTA + FOOTER
// ══════════════════════════════════════════════════════════════
function CTASection({ onOpenAuth }: { onOpenAuth: OpenAuthFn }) {
  return (
    <section className="relative py-28 px-4 md:px-8 overflow-hidden">
      <TechGrid/>
      <AmbientBackground/>
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 40px rgba(212,175,55,0.1)','0 0 80px rgba(212,175,55,0.22)','0 0 40px rgba(212,175,55,0.1)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <Scissors size={26} style={{ color: '#D4AF37' }}/>
          </motion.div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px,4.5vw,64px)', fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: '16px' }}>
            Pronto para transformar<br/>sua barbearia?
          </h2>
          <p style={{ color: 'rgba(113,113,122,0.65)', fontSize: '15px', marginBottom: '36px' }}>
            Sem cartão de crédito · Setup em 5 minutos · Suporte em português
          </p>
          <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 80px rgba(212,175,55,0.5)' }} whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAuth('register')}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-black text-base"
            style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37,#ECCb52)', letterSpacing: '0.02em' }}>
            Começar Gratuitamente <ArrowRight size={17}/>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t px-4 md:px-8 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)' }}>
                <Scissors size={13} style={{ color: '#D4AF37' }}/>
              </div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>LEGACY</div>
                <div style={{ fontSize: '7px', color: 'rgba(113,113,122,0.4)', letterSpacing: '0.36em' }}>BARBER</div>
              </div>
            </div>
            <p style={{ color: 'rgba(113,113,122,0.5)', fontSize: '13px', lineHeight: 1.7, maxWidth: '280px' }}>
              O sistema de gestão para barbearias de elite. Tecnologia que eleva o padrão do seu negócio.
            </p>
          </div>
          {[
            { title: 'Produto',  links: ['Recursos','Preços','Changelog','Status'] },
            { title: 'Empresa',  links: ['Sobre','Blog','Contato','Parceiros'] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(113,113,122,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
                {col.title}
              </div>
              <div className="space-y-2.5">
                {col.links.map(link => (
                  <div key={link} style={{ fontSize: '13px', color: 'rgba(113,113,122,0.5)', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = '#D4AF37' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = 'rgba(113,113,122,0.5)' }}>
                    {link}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '12px', color: 'rgba(113,113,122,0.35)' }}>© 2025 Legacy Barber. Todos os direitos reservados.</span>
          <span style={{ fontSize: '12px', color: 'rgba(113,113,122,0.35)' }}>Feito com precisão artesanal.</span>
        </div>
      </div>
    </footer>
  )
}

// ══════════════════════════════════════════════════════════════
// LANDING PAGE (assembler)
// ══════════════════════════════════════════════════════════════
function LandingPage({ onOpenAuth }: { onOpenAuth: OpenAuthFn }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#050505', minHeight: '100vh' }}>
      <LandingNav onOpenAuth={onOpenAuth}/>
      <HeroSection onOpenAuth={onOpenAuth}/>
      <FeaturesSection/>
      <StatsSection/>
      <HowItWorksSection/>
      <TestimonialsSection/>
      <PricingSection onOpenAuth={onOpenAuth}/>
      <CTASection onOpenAuth={onOpenAuth}/>
      <LandingFooter/>
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
  const [showAuth, setShowAuth]   = useState(false)
  const [authMode, setAuthMode]   = useState<'login' | 'register'>('login')

  const openAuth: OpenAuthFn = (mode = 'login') => { setAuthMode(mode); setShowAuth(true) }
  const closeAuth = () => setShowAuth(false)

  const login = (u: AppUser) => {
    setUser(u)
    setShowAuth(false)
    setTab(u.role === 'admin' ? 'dashboard' : 'agenda')
  }
  const logout = () => { setUser(null); setMobile(false) }
  const addUser = (u: AppUser) => setUsers(p => [...p, u])

  // ── Not authenticated ──────────────────────────────────────
  if (!currentUser) return (
    <>
      <LandingPage onOpenAuth={openAuth}/>
      <AuthModal open={showAuth} onClose={closeAuth} initialMode={authMode} users={users} onAuth={login} onRegister={addUser}/>
    </>
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
