import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors, User, LogIn, UserPlus, Eye, EyeOff,
  Phone, Lock, Mail, Building2, Crown, Sparkles,
} from 'lucide-react'
import type { AppUser, UserRole } from '../../types'
import { AuthInput } from '../ui/AuthInput'

interface AuthFormProps {
  users: AppUser[]
  onAuth: (user: AppUser) => void
  onRegister: (user: AppUser) => void
  initialMode?: 'login' | 'register'
}

export function AuthForm({ users, onAuth, onRegister, initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode]         = useState<'login' | 'register'>(initialMode)
  const [role, setRole]         = useState<UserRole>('client')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', phone: '', password: '', specialty: '', barbershopName: '' })

  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const roleCards: { value: UserRole; label: string; icon: React.ElementType; desc: string; badge?: string }[] = [
    { value: 'client', label: 'Cliente',     icon: User,    desc: 'Agende seu horário online com facilidade' },
    { value: 'barber', label: 'Barbeiro',    icon: Scissors,desc: 'Gerencie sua agenda e atendimentos' },
    { value: 'admin',  label: 'Proprietário',icon: Crown,   desc: 'Controle total da barbearia', badge: 'ADM' },
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
        name: form.name, email: form.email, phone: form.phone,
        password: form.password, role, avatar: initials,
        specialty:      role === 'barber' ? form.specialty      : undefined,
        barbershopName: role === 'admin'  ? form.barbershopName : undefined,
      }
      onRegister(newUser)
      onAuth(newUser)
    }
    setLoading(false)
  }

  return (
    <div className="rounded-3xl p-6" style={{
      background: 'rgba(8,8,8,0.97)',
      backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
    }}>
      {/* Logo */}
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
              <motion.button key={rc.value}
                whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.97 }}
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
                    background: 'rgba(212,175,55,0.14)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)',
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

      {/* Fields */}
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
            label="Senha" type={showPass ? 'text' : 'password'}
            value={form.password} onChange={set('password')}
            icon={Lock} placeholder="••••••••"
            rightEl={
              <button onClick={() => setShowPass(p => !p)} style={{ color: 'rgba(113,113,122,0.5)' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center py-2 px-3 rounded-xl text-xs font-medium"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01, boxShadow: '0 0 50px rgba(212,175,55,0.35)' }} whileTap={{ scale: 0.98 }}
            onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2 mt-1"
            style={{
              background: loading ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg, #B8951F, #D4AF37, #ECCb52)',
              letterSpacing: '0.02em', cursor: loading ? 'not-allowed' : 'pointer',
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

          {mode === 'login' && (() => {
            const hints: Record<UserRole, string> = {
              admin: 'admin@legacy.com', barber: 'carlos@legacy.com', client: 'pedro@email.com',
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
  )
}
