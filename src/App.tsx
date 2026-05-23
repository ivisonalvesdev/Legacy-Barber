import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, Menu, X } from 'lucide-react'

import type { AppUser, OpenAuthFn } from './types'
import { MOCK_USERS }          from './data/mock'

import { AmbientBackground }      from './components/ui/AmbientBackground'
import { LandingPage }            from './components/landing/LandingPage'
import { AuthModal }              from './components/auth/AuthModal'
import { Sidebar }                from './components/dashboard/Sidebar'
import { ClientView }             from './components/dashboard/ClientView'
import { BarberView }             from './components/dashboard/BarberView'
import { AdminDashboardView }     from './components/dashboard/AdminDashboardView'
import { AdminEstoqueView }       from './components/dashboard/AdminEstoqueView'
import { AdminEquipeView }        from './components/dashboard/AdminEquipeView'
import { AdminRelatoriosView }    from './components/dashboard/AdminRelatoriosView'
import { NAV_MAP }                from './components/dashboard/Sidebar'

export default function App() {
  const [users, setUsers]       = useState<AppUser[]>(MOCK_USERS)
  const [currentUser, setUser]  = useState<AppUser | null>(null)
  const [tab, setTab]           = useState('agenda')
  const [mobileOpen, setMobile] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const openAuth: OpenAuthFn = (mode = 'login') => { setAuthMode(mode); setShowAuth(true) }
  const closeAuth = () => setShowAuth(false)

  const login = (u: AppUser) => {
    setUser(u)
    setShowAuth(false)
    setTab(u.role === 'admin' ? 'dashboard' : 'agenda')
  }
  const logout  = () => { setUser(null); setMobile(false) }
  const addUser = (u: AppUser) => setUsers(p => [...p, u])

  // ── Unauthenticated ─────────────────────────────────────────
  if (!currentUser) return (
    <>
      <LandingPage onOpenAuth={openAuth} />
      <AuthModal
        open={showAuth} onClose={closeAuth}
        initialMode={authMode} users={users}
        onAuth={login} onRegister={addUser}
      />
    </>
  )

  // ── Admin view router ────────────────────────────────────────
  function AdminView() {
    if (tab === 'estoque')    return <AdminEstoqueView />
    if (tab === 'equipe')     return <AdminEquipeView />
    if (tab === 'relatorios') return <AdminRelatoriosView />
    return <AdminDashboardView user={currentUser!} />
  }

  // ── Authenticated ────────────────────────────────────────────
  const navItems = NAV_MAP[currentUser.role]

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

      {/* Mobile dropdown — mostra todos os itens do role atual */}
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
                      color: active ? '#D4AF37' : 'rgba(161,161,170,0.7)',
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

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6 md:py-8">
            <AnimatePresence mode="wait">
              <motion.div key={`${currentUser.role}-${tab}`}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.26 }}>
                {currentUser.role === 'client' && <ClientView user={currentUser} />}
                {currentUser.role === 'barber' && <BarberView user={currentUser} />}
                {currentUser.role === 'admin'  && <AdminView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
