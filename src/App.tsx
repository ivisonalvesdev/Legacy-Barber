import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

import type { AppUser, OpenAuthFn, UserRole } from './types'
import { supabase } from './lib/supabase'
import { identifyOneSignalUser, resetOneSignalUser } from './lib/onesignal'

import { AmbientBackground }      from './components/ui/AmbientBackground'
import { ScissorsBackdrop }       from './components/ui/ScissorsBackdrop'
import { SnipScissors }           from './components/ui/SnipScissors'
import { Preloader }              from './components/ui/Preloader'
import { BookingToastStack, useBookingToasts } from './components/ui/BookingToast'
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
import { AdminAgendaView }         from './components/dashboard/AdminAgendaView'
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
  // Evita buscar o perfil duas vezes quando INITIAL_SESSION e SIGNED_IN
  // chegam em sequência (ex.: link de confirmação de e-mail)
  const hasUserRef = useRef(false)
  const { items: toasts, push: pushToast, dismiss: dismissToast } = useBookingToasts()

  // Garante que o splash (contagem 0→100%) apareça por completo
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2000)
    return () => clearTimeout(t)
  }, [])

  // ── Restaura sessão ao recarregar a página ─────────────────
  useEffect(() => {
    let active = true

    // Rede de segurança: se qualquer chamada de auth pendurar (lock travado,
    // rede fora), libera o app em 6s em vez de ficar preso no preloader.
    const safety = setTimeout(() => { if (active) setAuthLoading(false) }, 6000)

    const fetchProfile = async (userId: string, email: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (data && active) {
          let barbershopName: string | undefined
          if (data.barbershop_id) {
            const { data: shop } = await supabase
              .from('barbershops').select('name')
              .eq('id', data.barbershop_id).single()
            barbershopName = shop?.name
          }

          hasUserRef.current = true
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
        if (active) setAuthLoading(false)
      }
    }

    // Restauração determinística: pergunta a sessão diretamente, em vez de
    // depender só do evento INITIAL_SESSION (que pode demorar/não chegar num
    // primeiro load frio). Libera o app assim que a resposta chega.
    const restore = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && !hasUserRef.current) {
          await fetchProfile(session.user.id, session.user.email!)
        } else if (active) {
          setAuthLoading(false)
        }
      } catch (err) {
        console.error('[auth] Falha ao restaurar sessão:', err)
        if (active) setAuthLoading(false)
      }
    }
    restore()

    // Escuta mudanças posteriores (login/logout, link de confirmação de e-mail).
    // IMPORTANTE: NÃO usar await de outra query supabase DENTRO deste callback —
    // o SDK segura um lock durante o callback e o await de .from(...) causa
    // deadlock (o app trava eternamente ao dar refresh logado). Por isso o
    // fetchProfile é disparado em setTimeout(0), FORA do lock do callback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        if (session?.user && !hasUserRef.current) {
          const { id, email } = session.user
          setTimeout(() => { if (active) fetchProfile(id, email!) }, 0)
        }
      } else if (event === 'SIGNED_OUT') {
        hasUserRef.current = false
        if (active) { setUser(null); setAuthLoading(false) }
      }
    })

    return () => { active = false; clearTimeout(safety); subscription.unsubscribe() }
  }, [])

  // ── Push (OneSignal): associa o dispositivo ao usuário logado ──
  useEffect(() => {
    if (currentUser) identifyOneSignalUser(currentUser.id)
  }, [currentUser])

  // ── Toast em tempo real de novo agendamento (barbeiro e dono) ──
  // Complementa o push do sistema: só aparece com o app aberto, mas usa a
  // identidade visual da marca. Cliente não recebe (é o próprio agendamento dele).
  // Deps primitivas (não o objeto currentUser) evitam reconectar o canal a cada
  // render — a referência do objeto muda ao atualizar perfil, o id/role/shop não.
  const userId       = currentUser?.id
  const userRole     = currentUser?.role
  const barbershopId = currentUser?.barbershopId
  useEffect(() => {
    if (!userId || userRole === 'client' || !barbershopId) return

    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const handleInsert = async (row: {
      id: string; barber_id: string | null; client_id: string | null
      client_name: string | null; service_name: string; time: string
    }) => {
      if (cancelled) return
      // Barbeiro só vê os próprios; o dono (admin) vê todos da barbearia.
      if (userRole === 'barber' && row.barber_id !== userId) return

      // O nome do cliente pode não vir no payload (agendamento pelo app usa
      // client_id, não client_name) — busca em profiles quando necessário.
      let client = row.client_name ?? ''
      if (!client && row.client_id) {
        const { data } = await supabase.from('profiles').select('name').eq('id', row.client_id).single()
        client = data?.name ?? ''
      }
      if (cancelled) return
      pushToast({
        id:      row.id,
        client:  client || 'Novo cliente',
        service: row.service_name,
        time:    row.time,
      })
    }

    // Abre o canal DEPOIS de autenticar o Realtime com o JWT do usuário. Sem
    // esse passo o socket assina só com a anon key e a RLS de `bookings` pode
    // barrar os eventos — o toast nunca chega. Aplicamos o token UMA vez, aqui,
    // antes de assinar: NÃO via onAuthStateChange (causava loop de reconexão
    // `_reconnectAuth`) nem via a opção `accessToken` do createClient (que
    // desabilita getSession/login e quebra o app inteiro).
    const connect = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      await supabase.realtime.setAuth(data.session?.access_token ?? null)
      if (cancelled) return

      // Em algumas redes (firewall / antivírus com inspeção SSL) o WebSocket do
      // Realtime não abre — nesse caso desistimos após poucas falhas em vez de
      // reconectar em loop (que polui o console). O app funciona normal sem o
      // toast; o push do OneSignal cobre o aviso mesmo com o app fechado.
      let failures = 0
      channel = supabase
        .channel(`bookings-toast-${barbershopId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'bookings',
          filter: `barbershop_id=eq.${barbershopId}`,
        }, payload => { void handleInsert(payload.new as Parameters<typeof handleInsert>[0]) })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            failures = 0
            console.info('[toast] Realtime conectado ✅')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            failures += 1
            // Após 3 falhas, para de tentar — evita o loop de reconexão no console.
            if (failures >= 3 && channel) {
              supabase.removeChannel(channel)
              channel = null
            }
          }
        })
    }
    void connect()

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
  }, [userId, userRole, barbershopId, pushToast])

  const openAuth: OpenAuthFn = (mode = 'login') => { setAuthMode(mode); setShowAuth(true) }
  const closeAuth = () => setShowAuth(false)

  const login = (u: AppUser) => {
    hasUserRef.current = true
    setUser(u)
    setShowAuth(false)
    setTab(u.role === 'admin' ? 'dashboard' : 'agenda')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    await resetOneSignalUser()
    hasUserRef.current = false
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
      tab === 'agenda'       ? <AdminAgendaView user={currentUser} />
      : tab === 'barbearia'  ? <AdminBarbeariaView user={currentUser} onUpdate={setUser} />
      : tab === 'servicos'   ? <AdminServicosView user={currentUser} />
      : tab === 'estoque'    ? <AdminEstoqueView user={currentUser} />
      : tab === 'equipe'     ? <AdminEquipeView user={currentUser} />
      : tab === 'relatorios' ? <AdminRelatoriosView user={currentUser} />
      : tab === 'perfil'     ? <ProfileView user={currentUser} onUpdate={setUser} />
      : <AdminDashboardView user={currentUser} />
    )

  return (
    <div className="min-h-screen text-white relative"
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#050505' }}>
      <AmbientBackground />
      <ScissorsBackdrop />

      {/* Mobile header */}
      <header className="md:hidden relative z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(22px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="logo-snip flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)' }}>
            <SnipScissors size={14} speed={0.5} hoverOnly />
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

      <BookingToastStack items={toasts} onDismiss={dismissToast} />
    </div>
  )
}
