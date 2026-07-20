import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, User } from 'lucide-react'
import { SnipScissors } from './SnipScissors'

export type BookingToastData = {
  id:      string   // usa o id do booking — evita duplicar o mesmo toast
  client:  string
  service: string
  time:    string
}

interface ToastItemProps {
  data: BookingToastData
  onClose: (id: string) => void
}

const AUTO_DISMISS_MS = 7000

function ToastItem({ data, onClose }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose(data.id), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [data.id, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="pointer-events-auto relative flex items-start gap-3 p-4 rounded-2xl overflow-hidden"
      style={{
        width: 320,
        background: 'rgba(10,10,10,0.97)',
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(212,175,55,0.28)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(212,175,55,0.08)',
      }}>
      {/* barra de progresso do auto-dismiss */}
      <motion.div
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg,#B8951F,#D4AF37,#ECCb52)',
          transformOrigin: 'left',
        }}
      />

      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
        <SnipScissors size={18} speed={0.8} />
      </div>

      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 700, color: '#D4AF37', lineHeight: 1.2 }}>
          Novo agendamento!
        </p>
        <p className="mt-1 flex items-center gap-1.5" style={{ fontSize: '12.5px', color: 'rgba(230,230,230,0.9)' }}>
          <User size={12} style={{ color: 'rgba(212,175,55,0.7)', flexShrink: 0 }} />
          <span className="truncate">{data.client}</span>
        </p>
        <p className="mt-0.5" style={{ fontSize: '12px', color: 'rgba(161,161,170,0.8)' }}>
          {data.service}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5" style={{ fontSize: '11px', color: 'rgba(113,113,122,0.72)' }}>
          <Clock size={11} />
          {data.time}
        </p>
      </div>

      <button onClick={() => onClose(data.id)}
        className="flex-shrink-0 p-1 rounded-lg transition-colors"
        style={{ color: 'rgba(113,113,122,0.6)' }}>
        <X size={14} />
      </button>
    </motion.div>
  )
}

/**
 * Empilha os avisos de novo agendamento no canto inferior direito, com a
 * identidade visual da marca. Só existe enquanto o app está aberto (é o
 * complemento "bonito" do push do sistema, que funciona mesmo fechado).
 */
export function BookingToastStack({ items, onDismiss }: {
  items: BookingToastData[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2.5 pointer-events-none">
      <AnimatePresence>
        {items.map(t => <ToastItem key={t.id} data={t} onClose={onDismiss} />)}
      </AnimatePresence>
    </div>
  )
}

/** Gerencia a fila de toasts (máx. 3 visíveis por vez). */
export function useBookingToasts() {
  const [items, setItems] = useState<BookingToastData[]>([])

  const push = useCallback((data: BookingToastData) => {
    setItems(prev => {
      if (prev.some(t => t.id === data.id)) return prev   // evita duplicar
      return [...prev.slice(-2), data]                     // mantém no máx. 3
    })
  }, [])

  const dismiss = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  return { items, push, dismiss }
}
