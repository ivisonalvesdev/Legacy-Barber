import { useState } from 'react'

interface AuthInputProps {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  icon: React.ElementType
  placeholder?: string
  rightEl?: React.ReactNode
  /** Dispara ao apertar Enter dentro do campo (envia o formulário). */
  onEnter?: () => void
}

export function AuthInput({
  label, type = 'text', value, onChange, icon: Icon, placeholder, rightEl, onEnter,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </label>
      <div className="relative flex items-center" style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${focused ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '12px',
        transition: 'border-color 0.2s',
        boxShadow: focused ? '0 0 20px rgba(212,175,55,0.08)' : 'none',
      }}>
        <Icon size={14} className="ml-3.5 flex-shrink-0"
          style={{ color: focused ? '#D4AF37' : 'rgba(113,113,122,0.64)', transition: 'color 0.2s' }} />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter() } }}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder-zinc-600"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        />
        {rightEl && <div className="mr-3 flex-shrink-0">{rightEl}</div>}
      </div>
    </div>
  )
}
