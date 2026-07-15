import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors, User, LogIn, UserPlus, Eye, EyeOff,
  Phone, Lock, Mail, Building2, Crown, Sparkles, Hash,
} from 'lucide-react'
import type { AppUser, UserRole } from '../../types'
import { AuthInput } from '../ui/AuthInput'
import { supabase }  from '../../lib/supabase'

interface AuthFormProps {
  onAuth: (user: AppUser) => void
  initialMode?: 'login' | 'register'
}

export function AuthForm({ onAuth, initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode]         = useState<'login' | 'register'>(initialMode)
  const [role, setRole]         = useState<UserRole>('client')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({
    name: '', email: '', phone: '', password: '',
    specialty: '', barbershopName: '', inviteCode: '',
  })

  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const roleCards: { value: UserRole; label: string; icon: React.ElementType; desc: string; badge?: string }[] = [
    { value: 'client', label: 'Cliente',      icon: User,    desc: 'Agende seu horário online com facilidade' },
    { value: 'barber', label: 'Barbeiro',     icon: Scissors,desc: 'Gerencie sua agenda e atendimentos' },
    { value: 'admin',  label: 'Proprietário', icon: Crown,   desc: 'Controle total da barbearia', badge: 'ADM' },
  ]

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      // ── LOGIN ──────────────────────────────────────────────────────
      if (mode === 'login') {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: form.email, password: form.password,
        })
        if (authErr) {
          if (authErr.message.toLowerCase().includes('email not confirmed'))
            throw new Error('✉️ Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')
          throw new Error('E-mail ou senha incorretos.')
        }
        if (!data.user) throw new Error('E-mail ou senha incorretos.')

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileErr || !profile) throw new Error('Perfil não encontrado. Tente novamente.')

        // Busca nome da barbearia separado (mais robusto que join FK)
        let barbershopName: string | undefined
        if (profile.barbershop_id) {
          const { data: shop } = await supabase
            .from('barbershops').select('name')
            .eq('id', profile.barbershop_id).single()
          barbershopName = shop?.name
        }

        onAuth({
          id:             profile.id,
          name:           profile.name,
          email:          data.user.email!,
          phone:          profile.phone         ?? '',
          role:           profile.role          as UserRole,
          barbershopId:   profile.barbershop_id ?? undefined,
          barbershopName,
          specialty:      profile.specialty     ?? undefined,
          avatar:         profile.avatar        ?? '',
          avatarUrl:      profile.avatar_url    ?? undefined,
        })
        return
      }

      // ── CADASTRO ───────────────────────────────────────────────────
      if (!form.name || !form.email || !form.phone || !form.password)
        throw new Error('Preencha todos os campos obrigatórios.')
      if (form.password.length < 6)
        throw new Error('A senha deve ter pelo menos 6 caracteres.')

      // Barber precisa de código de convite
      if (role === 'barber' && !form.inviteCode.trim())
        throw new Error('Insira o código da barbearia fornecido pelo proprietário.')

      // Valida código de convite (antes de criar a conta).
      // Via RPC: a tabela não expõe invite_code, senão qualquer um leria o
      // código de qualquer barbearia e entraria na equipe dela.
      let targetShopId: string | null = null
      let targetShopName: string | null = null
      if (role === 'barber') {
        const { data: shops, error: shopErr } = await supabase
          .rpc('find_shop_by_invite', { p_code: form.inviteCode.trim() })
        const shop = shops?.[0]
        if (shopErr || !shop) throw new Error('Código de convite inválido. Verifique com o proprietário.')
        targetShopId   = shop.id
        targetShopName = shop.name
      }

      // Cria conta no Supabase Auth
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options: {
          data: {
            name:            form.name,
            role,
            phone:           form.phone,
            specialty:       role === 'barber' ? form.specialty      || null : null,
            barbershop_name: role === 'admin'  ? form.barbershopName || null : null,
          },
        },
      })

      if (signUpErr) throw new Error(
        signUpErr.message.includes('already registered')
          ? 'Este e-mail já está cadastrado.'
          : signUpErr.message
      )

      // Confirmação de e-mail habilitada — sem sessão ainda
      if (!data.session) {
        setError('✉️ Conta criada! Verifique seu e-mail para confirmar o cadastro.')
        setLoading(false)
        return
      }

      if (!data.user) throw new Error('Erro ao criar conta. Tente novamente.')

      // Aguarda o trigger do Supabase criar a linha em profiles (poll com retry,
      // em vez de sleep fixo — resolve rápido quando o trigger é rápido)
      let profileReady = false
      for (let attempt = 0; attempt < 10; attempt++) {
        const { data: p } = await supabase
          .from('profiles').select('id').eq('id', data.user.id).maybeSingle()
        if (p) { profileReady = true; break }
        await new Promise(r => setTimeout(r, 400))
      }
      if (!profileReady)
        throw new Error('Conta criada, mas o perfil demorou para ser gerado. Faça login em instantes.')

      const userId   = data.user.id
      const initials = form.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

      // ── Admin: cria barbearia e vincula ao perfil ─────────────────
      let barbershopId:   string | undefined
      let barbershopName: string | undefined

      if (role === 'admin') {
        const shopName = form.barbershopName.trim() || 'Minha Barbearia'

        const { data: shop, error: shopErr } = await supabase
          .from('barbershops')
          .insert({ name: shopName, owner_id: userId })
          .select('id, name')
          .single()

        if (shopErr || !shop) throw new Error('Erro ao criar barbearia. Tente novamente.')

        await supabase.from('profiles').update({ barbershop_id: shop.id }).eq('id', userId)

        barbershopId   = shop.id
        barbershopName = shop.name
      }

      // ── Barber: vincula à barbearia pelo invite_code ──────────────
      if (role === 'barber' && targetShopId) {
        await supabase.from('profiles').update({ barbershop_id: targetShopId }).eq('id', userId)
        barbershopId   = targetShopId
        barbershopName = targetShopName ?? undefined
      }

      onAuth({
        id:             userId,
        name:           form.name,
        email:          form.email,
        phone:          form.phone,
        role,
        barbershopId,
        barbershopName,
        specialty:  role === 'barber' ? form.specialty      || undefined : undefined,
        avatar:     initials,
      })

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
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

      {/* Role selector — só no cadastro */}
      {mode === 'register' ? (
        <div className="mb-5">
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
            Cadastrar como
          </p>
          <div className="grid grid-cols-3 gap-2">
            {roleCards.map(rc => {
              const Icon = rc.icon
              const sel  = role === rc.value
              return (
                <motion.button key={rc.value}
                  whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setRole(rc.value); setError('') }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all duration-200"
                  style={{
                    background:  sel ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                    border:      `1px solid ${sel ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow:   sel ? '0 0 30px rgba(212,175,55,0.12), inset 0 0 20px rgba(212,175,55,0.03)' : 'none',
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
                      border:     `1px solid ${sel ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
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
      ) : null}

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
          {mode === 'register' && role === 'barber' && (
            <AuthInput
              label="Código da Barbearia"
              value={form.inviteCode}
              onChange={v => set('inviteCode')(v.toUpperCase())}
              icon={Hash}
              placeholder="Ex: A3F901"
            />
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
                style={{
                  background: error.startsWith('✉️') ? 'rgba(74,222,128,0.07)' : 'rgba(239,68,68,0.07)',
                  border: `1px solid ${error.startsWith('✉️') ? 'rgba(74,222,128,0.18)' : 'rgba(239,68,68,0.18)'}`,
                  color: error.startsWith('✉️') ? '#4ade80' : '#f87171',
                }}>
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
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
