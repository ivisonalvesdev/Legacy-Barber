import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { AppUser } from '../../types'
import { AuthForm } from './AuthForm'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  onAuth: (user: AppUser) => void
}

export function AuthModal({ open, onClose, initialMode = 'login', onAuth }: AuthModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — apenas visual, sem capturar eventos */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', background: 'rgba(0,0,0,0.72)' }}
          />

          {/* Container scrollável — clique fora fecha, scroll funciona */}
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={onClose}
          >
            <div className="flex min-h-full items-center justify-center p-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: 36, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 36, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-md my-4"
                onClick={e => e.stopPropagation()}
              >
                <button onClick={onClose}
                  className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(113,113,122,0.7)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(113,113,122,0.7)' }}>
                  <X size={14} />
                </button>
                <AuthForm
                  key={`${String(open)}-${initialMode}`}
                  onAuth={onAuth} initialMode={initialMode}
                />
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
