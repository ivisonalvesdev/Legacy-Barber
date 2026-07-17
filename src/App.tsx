import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, Menu, X } from 'lucide-react'

import type { AppUser, OpenAuthFn, UserRole } from './types'
import { supabase } from './lib/supabase'

import { AmbientBackground }      from './components/ui/AmbientBackground'
import { Preloader }              from './components/ui/Preloader'
import { Avatar }                 from './components/ui/Avatar'
import { LandingPage }            from './components/landing/LandingPage'
import { AuthModal }              from './components/auth/AuthModal'
import { Sidebar }                from './components/dashboard/Sidebar'
import { ClientView }             from './components/dashboard/ClientView'
import { ClientBookingsView }     from './components/dashboard/ClientBookingsView'
import { BarberView }             from './components/dashboard/BarberView'
import { BarberInsumosView }      from './components/dashboard/BarberInsumosView'
import { ProfileView }            from './components/dashboard/ProfileView'
import { AdminDashboardView }     from './components/dashboard/AdminDashboardView'
import { AdminBarbeariaView }     from './components/dashboard/AdminBarbeariaView'
import { AdminServicosView }      from './components/dashboard/AdminServicosView'
import { AdminEstoqueView }       from './components/dashboard/AdminEstoqueView'
import { AdminEquipeView }        from './components/dashboard/AdminEquipeView'
import { AdminRelatoriosView }    from './components/dashboard/AdminRelatoriosView'
import { NAV_MAP }                from './components/dashboard/nav'

export default function App() {
  const [currentUser, setUser]  = useState<AppUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab]           = useState('agenda')
  const [mobileOpen, setMobile] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [splashDone, setSplashDone] = useState(false)

  // Garante que o splash (contagem 0→100%) apareça por completo
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2000)
    return () => clearTimeout(t)
  }, [])

  // ── Restaura sessão ao recarregar a página ─────────────────
  useEffect(() => {
    const fetchProfile = async (userId: string, email: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (data) {
          let barbershopName: string | undefined
          if (data.barbershop_id) {
            const { data: shop } = await supabase
              .from('barbershops').select('name')
              .eq('id', data.barbershop_id).single()
            barbershopName = shop?.name
          }

          setUser({
            id:             data.id,
            name:           data.name,
            email,
            phone:          data.phone         ?? '',
            role:           data.role          as UserRole,
            barbershopId:   data.barbershop_id ?? undefined,
            barbershopName,
            specialty:      data.specialty     ?? undefined,
            avatar:         data.avatar        ?? '',
            avatarUrl:      data.avatar_url    ?? undefined,
          })
          setTab(data.role === 'admin' ? 'dashboard' : 'agenda')
        }
      } catch (err) {
        console.error('[fetchProfile] Falha ao restaurar sessão:', err)
      } finally {
        setAuthLoading(false)
      }
    }

    // Timeout de segurança: se Supabase não responder em 8s, libera a landing page
    const fallback = setTimeout(() => setAuthLoading(false), 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      clearTimeout(fallback)
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email!)
        } else {
          setAuthLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthLoading(false)
      }
    })

    return () => { subscription.unsubscribe(); clearTimeout(fallback) }
  }, [])

  const openAuth: OpenAuthFn = (mode = 'login') => { setAuthMode(mode); setShowAuth(true) }
  const closeAuth = () => setShowAuth(false)

  const login = (u: AppUser) => {
    setUser(u)
    setShowAuth(false)
    setTab(u.role === 'admin' ? 'dashboard' : 'agenda')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMobile(false)
  }

  // ── Carregando sessão (evita flash da landing) ─────────────
  if (authLoading || !splashDone) return <Preloader />

  // ── Não autenticado ────────────────────────────────────────
  if (!currentUser) return (
    <>
      <LandingPage onOpenAuth={openAuth} />
      <AuthModal
        open={showAuth} onClose={closeAuth}
        initialMode={authMode} onAuth={login}
      />
    </>
  )

  // ── Autenticado ────────────────────────────────────────────
  const navItems = NAV_MAP[currentUser.role]

  // View ativa por papel + tab (JSX condicional, sem componentes aninhados)
  const activeView =
    currentUser.role === 'client' ? (
      tab === 'agendamentos' ? <ClientBookingsView user={currentUser} />
      : tab === 'perfil'     ? <ProfileView user={currentUser} onUpdate={setUser} />
      : <ClientView user={currentUser} />
    ) : currentUser.role === 'barber' ? (
      tab === 'insumos'     ? <BarberInsumosView user={currentUser} />
      : tab === 'perfil'    ? <ProfileView user={currentUser} onUpdate={setUser} />
      : <BarberView user={currentUser} />
    ) : (
      tab === 'barbearia'    ? <AdminBarbeariaView user={currentUser} onUpdate={setUser} />
      : tab === 'servicos'   ? <AdminServicosView user={currentUser} />
      : tab === 'estoque'    ? <AdminEstoqueView user={currentUser} />
      : tab === 'equipe'     ? <AdminEquipeView user={currentUser} />
      : tab === 'relatorios' ? <AdminRelatoriosView user={currentUser} />
      : <AdminDashboardView user={currentUser} />
    )

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
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 700, color: '#D4AF37' }}>LEGACY</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <Avatar url={currentUser.avatarUrl} fallback={currentUser.avatar || currentUser.name} size={20} rounded="full" highlight />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(212,175,55,0.8)' }}>
              {currentUser.name.split(' ')[0]}
            </span>
          </div>
          <button onClick={() => setMobile(o => !o)} style={{ color: 'rgba(113,113,122,0.86)' }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="md:hidden relative z-40 px-4 py-3"
            style={{ background: 'rgba(7,7,7,0.96)', backdropFilter: 'blur(22px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="space-y-0.5 mb-2">
              {navItems.map(item => {
                const Icon   = item.icon
                const active = tab === item.id
                return (
                  <button key={item.id}
                    onClick={() => { setTab(item.id); setMobile(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{
                      color: active ? '#D4AF37' : 'rgba(161,161,170,0.86)',
                      background: active ? 'rgba(212,175,55,0.06)' : 'transparent',
                    }}>
                    <Icon size={14} />{item.label}
                  </button>
                )
              })}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{ color: 'rgba(239,68,68,0.6)' }}>
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop layout */}
      <div className="flex relative z-10" style={{ minHeight: '100vh' }}>
        <div className="hidden md:block flex-shrink-0">
          <Sidebar user={currentUser} activeTab={tab} setActiveTab={setTab} onLogout={logout} />
        </div>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="px-4 md:px-8 py-6 md:py-8">
            <motion.div key={`${currentUser.role}-${tab}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}>
              {activeView}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
