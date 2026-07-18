import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Scissors, Check, Building2, Mail } from 'lucide-react'
import type { AppUser } from '../../types'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'
import { ImageUpload } from '../ui/ImageUpload'

interface ProfileViewProps {
  user: AppUser
  onUpdate: (u: AppUser) => void
}

export function ProfileView({ user, onUpdate }: ProfileViewProps) {
  const [name, setName]           = useState(user.name)
  const [phone, setPhone]         = useState(user.phone)
  const [specialty, setSpecialty] = useState(user.specialty ?? '')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  // A foto salva sozinha, sem depender do botão do formulário: o upload já é
  // uma ação concluída e seria estranho perdê-la ao sair sem salvar.
  const saveAvatar = async (url: string | null) => {
    const { error: err } = await supabase.from('profiles')
      .update({ avatar_url: url }).eq('id', user.id)
    if (err) { setError('Erro ao salvar a foto.'); return }
    onUpdate({ ...user, avatarUrl: url ?? undefined })
  }

  // Admin também edita especialidade: o dono pode atender como barbeiro
  const hasSpecialty = user.role === 'barber' || user.role === 'admin'

  const dirty =
    name.trim() !== user.name ||
    phone.trim() !== user.phone ||
    (hasSpecialty && specialty.trim() !== (user.specialty ?? ''))

  const save = async () => {
    if (!name.trim()) { setError('O nome não pode ficar vazio.'); return }
    setSaving(true)
    setError('')

    const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    const updates: Record<string, string> = {
      name:   name.trim(),
      phone:  phone.trim(),
      avatar: initials,
    }
    if (hasSpecialty) updates.specialty = specialty.trim()

    const { error: err } = await supabase.from('profiles').update(updates).eq('id', user.id)
    setSaving(false)
    if (err) { setError('Erro ao salvar. Tente novamente.'); return }

    onUpdate({
      ...user,
      name:      name.trim(),
      phone:     phone.trim(),
      avatar:    initials,
      specialty: hasSpecialty ? specialty.trim() || undefined : user.specialty,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const roleLabel = user.role === 'admin' ? 'Proprietário' : user.role === 'barber' ? 'Barbeiro' : 'Cliente'

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.85)',
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
          Meu Perfil
        </h1>
        <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>
          Seus dados de conta
        </p>
      </div>

      {/* Cartão de identidade */}
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.16)' }}>
        <Avatar url={user.avatarUrl} fallback={user.avatar || user.name} size={56} rounded="2xl" highlight />
        <div className="flex-1 min-w-0">
          <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontSize: '16px' }} className="truncate">{user.name}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
              {roleLabel}
            </span>
            {user.barbershopName && (
              <span className="flex items-center gap-1" style={{ fontSize: '11px', color: 'rgba(113,113,122,0.77)' }}>
                <Building2 size={10} />{user.barbershopName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <ImageUpload
          folder={`users/${user.id}`}
          url={user.avatarUrl}
          fallback={user.avatar || user.name}
          onChange={saveAvatar}
          size={88}
          rounded="2xl"
          label="Foto de perfil"
        />

        <div>
          <label className="flex items-center gap-1.5" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Mail size={11} /> E-mail
          </label>
          <input value={user.email} disabled
            className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ ...inputStyle, color: 'rgba(113,113,122,0.82)', cursor: 'not-allowed' }} />
        </div>

        <div>
          <label className="flex items-center gap-1.5" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <User size={11} /> Nome completo
          </label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm"
            style={inputStyle} />
        </div>

        <div>
          <label className="flex items-center gap-1.5" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Phone size={11} /> Telefone / WhatsApp
          </label>
          <input value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm"
            style={inputStyle} />
        </div>

        {hasSpecialty && (
          <div>
            <label className="flex items-center gap-1.5" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Scissors size={11} /> Especialidade
            </label>
            <input value={specialty} onChange={e => setSpecialty(e.target.value)}
              placeholder={user.role === 'admin' ? 'Ex: Clássico & Navalha (você também atende)' : 'Ex: Degradê, Barba Artística'}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm"
              style={inputStyle} />
          </div>
        )}

        {error && (
          <p className="text-xs text-center py-2 rounded-xl"
            style={{ color: '#f87171', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.16)' }}>
            {error}
          </p>
        )}

        <motion.button
          whileHover={dirty ? { scale: 1.01 } : {}} whileTap={dirty ? { scale: 0.98 } : {}}
          onClick={save} disabled={!dirty || saving}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{
            background: saved
              ? 'rgba(74,222,128,0.12)'
              : dirty ? 'linear-gradient(135deg, #B8951F, #D4AF37)' : 'rgba(255,255,255,0.04)',
            color: saved ? '#4ade80' : dirty ? '#000' : 'rgba(113,113,122,0.52)',
            border: saved ? '1px solid rgba(74,222,128,0.3)' : '1px solid transparent',
            cursor: dirty && !saving ? 'pointer' : 'not-allowed',
          }}>
          <Check size={14} />
          {saved ? 'Salvo!' : saving ? 'Salvando…' : 'Salvar Alterações'}
        </motion.button>
      </div>
    </div>
  )
}
