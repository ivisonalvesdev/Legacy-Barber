import { motion } from 'framer-motion'

/**
 * Selo "AO VIVO" — a bolinha pulsa em verde quando o realtime está conectado.
 * Se o WebSocket cair (rede bloqueia), mostra "SINCRONIZANDO" em âmbar: a tela
 * segue atualizando pelo polling, então o selo nunca mente sobre o estado.
 * Pensado para telas que ficam abertas o dia todo (ex.: TV na barbearia).
 */
export function LiveBadge({ live }: { live: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full flex-shrink-0"
      style={{
        background: live ? 'rgba(74,222,128,0.07)' : 'rgba(212,175,55,0.07)',
        border: `1px solid ${live ? 'rgba(74,222,128,0.2)' : 'rgba(212,175,55,0.2)'}`,
      }}>
      <motion.div className="w-1.5 h-1.5 rounded-full"
        style={{ background: live ? '#4ade80' : '#D4AF37' }}
        animate={{ scale: [1, 1.35, 1], opacity: [1, 0.45, 1] }}
        transition={{ duration: live ? 1.6 : 2.4, repeat: Infinity, ease: 'easeInOut' }} />
      <span style={{ fontSize: '8px', fontWeight: 700, color: live ? '#4ade80' : '#D4AF37', letterSpacing: '0.1em' }}>
        {live ? 'AO VIVO' : 'SINCRONIZANDO'}
      </span>
    </div>
  )
}
