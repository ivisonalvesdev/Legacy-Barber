import { motion } from 'framer-motion'

export function TechGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.035 }}>
        <defs>
          <pattern id="tg" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M 52 0 L 0 0 0 52" fill="none" stroke="rgba(212,175,55,1)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tg)" />
      </svg>
      <motion.div
        animate={{ x: ['-2%', '102%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        className="absolute inset-y-0 w-px opacity-20"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.6), transparent)' }}
      />
    </div>
  )
}
