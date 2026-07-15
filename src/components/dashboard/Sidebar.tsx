import { motion } from 'framer-motion'
import { Scissors, LogOut } from 'lucide-react'
import type { AppUser } from '../../types'
import { NAV_MAP } from './nav'
import { Avatar } from '../ui/Avatar'

interface SidebarProps {
  user: AppUser
  activeTab: string
  setActiveTab: (t: string) => void
  onLogout: () => void
}

export function Sidebar({ user, activeTab, setActiveTab, onLogout }: SidebarProps) {
  const items = NAV_MAP[user.role]

  return (
    <aside className="w-[220px] flex flex-col h-screen sticky top-0" style={{
      background: 'rgba(5,5,5,0.9)',
      backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)' }}>
            <Scissors size={13} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>LEGACY</div>
            <div style={{ fontSize: '8px', color: 'rgba(113,113,122,0.5)', letterSpacing: '0.32em', marginTop: '2px' }}>BARBER</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        {items.map(item => {
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

      {/* User */}
      <div className="px-2.5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar url={user.avatarUrl} fallback={user.avatar || user.name} size={32} rounded="xl" highlight />
          <div className="flex-1 min-w-0">
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600 }} className="truncate">
              {user.name.split(' ')[0]}
            </div>
            <div style={{ color: 'rgba(113,113,122,0.55)', fontSize: '10px', textTransform: 'capitalize' }}>
              {user.role === 'admin' ? 'Proprietário' : user.role === 'barber' ? 'Barbeiro' : 'Cliente'}
            </div>
          </div>
          <motion.button whileHover={{ color: '#f87171', scale: 1.1 }} onClick={onLogout}
            style={{ color: 'rgba(113,113,122,0.4)', flexShrink: 0 }} title="Sair">
            <LogOut size={14} />
          </motion.button>
        </div>
      </div>
    </aside>
  )
}
