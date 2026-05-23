import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function TiltCard({ children, className, style }: TiltCardProps) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rX = useTransform(my, [-70, 70], [4, -4])
  const rY = useTransform(mx, [-70, 70], [-4, 4])
  const sX = useSpring(rX, { stiffness: 300, damping: 30 })
  const sY = useSpring(rY, { stiffness: 300, damping: 30 })

  return (
    <motion.div
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set(e.clientX - r.left - r.width / 2)
        my.set(e.clientY - r.top - r.height / 2)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
      style={{ rotateX: sX, rotateY: sY, transformPerspective: 900, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
