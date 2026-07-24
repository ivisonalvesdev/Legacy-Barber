import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open:        boolean
  title:       string
  message?:    string
  confirmText?: string
  cancelText?:  string
  /** 'danger' pinta o botão de ação em vermelho (ação destrutiva). */
  tone?:       'danger' | 'gold'
  loading?:    boolean
  onConfirm:   () => void
  onCancel:    () => void
}

// Pequena janela de confirmação (Sim / Não) para ações que não podem acontecer
// sem querer — ex.: cancelar um corte. Fecha ao clicar fora ou em "Não".
export function ConfirmDialog({
  open, title, message,
  confirmText = 'Sim', cancelText = 'Não',
  tone = 'danger', loading = false,
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  const danger = tone === 'danger'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={onCancel}>
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)',
                  border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(212,175,55,0.3)'}`,
                }}>
                <AlertTriangle size={22} style={{ color: danger ? '#f87171' : '#D4AF37' }} />
              </div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                {title}
              </h3>
              {message && (
                <p style={{ color: 'rgba(113,113,122,0.86)', fontSize: '13px', lineHeight: 1.6, marginTop: '8px' }}>
                  {message}
                </p>
              )}
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={onCancel} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.03)' }}>
                {cancelText}
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={onConfirm} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: danger
                    ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                    : 'linear-gradient(135deg, #B8951F, #D4AF37)',
                  color: danger ? '#fff' : '#000',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}>
                {loading ? '…' : confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
