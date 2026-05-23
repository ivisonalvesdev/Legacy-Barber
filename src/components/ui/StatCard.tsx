import { ArrowUpRight } from 'lucide-react'
import { TiltCard } from './TiltCard'
import { AnimatedNumber } from './AnimatedNumber'

interface StatCardProps {
  icon: React.ElementType
  label: string
  numValue: number
  prefix?: string
  suffix?: string
  featured?: boolean
}

export function StatCard({ icon: Icon, label, numValue, prefix = '', suffix = '', featured = false }: StatCardProps) {
  return (
    <TiltCard
      className="relative overflow-hidden rounded-2xl p-5 cursor-default"
      style={featured ? {
        background: 'rgba(212,175,55,0.07)',
        border: '1px solid rgba(212,175,55,0.22)',
        boxShadow: '0 0 40px rgba(212,175,55,0.07)',
      } : {
        background: 'rgba(255,255,255,0.022)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: featured ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.05)' }}>
        <Icon size={18} style={{ color: featured ? '#D4AF37' : 'rgba(113,113,122,0.9)' }} />
      </div>
      <div className="text-2xl font-bold mb-1"
        style={{ color: featured ? '#D4AF37' : 'white', fontFamily: "'DM Sans', sans-serif" }}>
        <AnimatedNumber value={numValue} prefix={prefix} suffix={suffix} />
      </div>
      <div style={{ fontSize: '10px', color: 'rgba(113,113,122,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
        {label}
      </div>
      {featured && (
        <ArrowUpRight size={13} style={{ position: 'absolute', top: 16, right: 16, color: 'rgba(212,175,55,0.35)' }} />
      )}
    </TiltCard>
  )
}
