import { motion } from 'framer-motion'

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <motion.div
        animate={{ opacity: [0.18, 0.24, 0.18] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)', filter: 'blur(50px)', willChange: 'opacity' }}
      />
      <motion.div
        animate={{ opacity: [0.07, 0.11, 0.07] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute -bottom-48 -right-48 w-[800px] h-[800px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(160,110,15,0.18) 0%, transparent 70%)', filter: 'blur(70px)', willChange: 'opacity' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.15) 0%, transparent 65%)', filter: 'blur(90px)' }}
      />
    </div>
  )
}
