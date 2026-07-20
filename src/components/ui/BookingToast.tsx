import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, CalendarCheck } from 'lucide-react'
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

const AUTO_DISMISS_MS = 8000

const initials = (name: string) =>
  name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '★'

function ToastItem({ data, onClose }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose(data.id), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [data.id, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 90, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 90, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="pointer-events-auto relative overflow-hidden"
      style={{
        width: 340,
        borderRadius: 18,
        background: 'linear-gradient(145deg, rgba(18,16,10,0.98) 0%, rgba(8,8,8,0.98) 100%)',
        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(212,175,55,0.32)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.6), 0 0 50px rgba(212,175,55,0.1), inset 0 1px 0 rgba(212,175,55,0.15)',
      }}>

      {/* brilho dourado no topo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 60,
        background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.14), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* header com selo */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2 relative">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.32)' }}>
          <SnipScissors size={15} speed={0.7} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <CalendarCheck size={12} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(212,175,55,0.9)', textTransform: 'uppercase' }}>
              Novo agendamento
            </span>
          </div>
        </div>
        <button onClick={() => onClose(data.id)}
          className="flex-shrink-0 p-1 rounded-md transition-colors hover:bg-white/5"
          style={{ color: 'rgba(113,113,122,0.55)' }}>
          <X size={13} />
        </button>
      </div>

      {/* corpo: avatar do cliente + detalhes */}
      <div className="flex items-center gap-3 px-4 pb-3.5">
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(184,149,31,0.1))',
            border: '1px solid rgba(212,175,55,0.35)',
            color: '#ECCb52', fontWeight: 700, fontSize: '15px',
            fontFamily: "'Cormorant Garamond', serif",
          }}>
          {initials(data.client)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate" style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(245,245,245,0.96)', lineHeight: 1.25 }}>
            {data.client}
          </p>
          <div className="flex items-center gap-2 mt-1" style={{ fontSize: '12px', color: 'rgba(161,161,170,0.82)' }}>
            <span className="truncate">{data.service}</span>
            <span style={{ color: 'rgba(212,175,55,0.4)' }}>•</span>
            <span className="flex items-center gap-1 flex-shrink-0" style={{ color: 'rgba(212,175,55,0.85)' }}>
              <Clock size={11} />{data.time}
            </span>
          </div>
        </div>
      </div>

      {/* barra de progresso do auto-dismiss */}
      <motion.div
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
        style={{
          height: '2.5px', transformOrigin: 'left',
          background: 'linear-gradient(90deg, #B8951F, #D4AF37, #ECCb52)',
          boxShadow: '0 0 8px rgba(212,175,55,0.5)',
        }}
      />
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
