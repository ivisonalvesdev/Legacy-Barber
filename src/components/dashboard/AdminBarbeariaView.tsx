import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Store, MapPin, Phone, Check, Eye, EyeOff, AlertCircle, FileText, Loader2, Building2 } from 'lucide-react'
import type { AppUser } from '../../types'
import { supabase } from '../../lib/supabase'
import { ImageUpload } from '../ui/ImageUpload'
import { lookupCep, lookupCnpj, formatCnpj, isCnpjComplete } from '../../lib/integrations'

interface AdminBarbeariaViewProps {
  user: AppUser
  onUpdate: (u: AppUser) => void
}

type Form = {
  name: string; description: string; phone: string; cnpj: string; legalName: string
  street: string; number: string; district: string
  city: string; state: string; zip: string
}

const EMPTY: Form = {
  name: '', description: '', phone: '', cnpj: '', legalName: '',
  street: '', number: '', district: '', city: '', state: '', zip: '',
}

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
  'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

// Sem endereço a barbearia não é encontrável na busca — por isso é o que
// destrava a publicação. Número fica de fora (existe "s/n").
const REQUIRED: (keyof Form)[] = ['name', 'street', 'district', 'city', 'state']

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.85)',
}

const labelStyle = {
  fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.82)',
  textTransform: 'uppercase' as const, letterSpacing: '0.08em',
}

type CepStatus  = 'idle' | 'loading' | 'ok' | 'error'
type CnpjStatus = 'idle' | 'loading' | 'ok' | 'error' | 'inactive'

export function AdminBarbeariaView({ user, onUpdate }: AdminBarbeariaViewProps) {
  const [form, setForm]         = useState<Form>(EMPTY)
  const [initial, setInitial]   = useState<Form>(EMPTY)
  const [logoUrl, setLogoUrl]   = useState<string | null>(null)
  const [published, setPub]     = useState(false)
  const [shopId, setShopId]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [cepStatus, setCepStatus]   = useState<CepStatus>('idle')
  const [cnpjStatus, setCnpjStatus] = useState<CnpjStatus>('idle')

  const load = useCallback(async () => {
    if (!user.barbershopId) { setLoading(false); return }
    try {
      const { data, error: err } = await supabase
        .from('barbershops')
        .select('id,name,description,phone,cnpj,legal_name,logo_url,published,address_street,address_number,address_district,address_city,address_state,address_zip')
        .eq('id', user.barbershopId)
        .single()

      if (err || !data) { setError('Não foi possível carregar a barbearia.'); return }

      const f: Form = {
        name:        data.name              ?? '',
        description: data.description       ?? '',
        phone:       data.phone             ?? '',
        cnpj:        data.cnpj              ?? '',
        legalName:   data.legal_name        ?? '',
        street:      data.address_street    ?? '',
        number:      data.address_number    ?? '',
        district:    data.address_district  ?? '',
        city:        data.address_city      ?? '',
        state:       data.address_state     ?? '',
        zip:         data.address_zip       ?? '',
      }
      setForm(f); setInitial(f)
      setLogoUrl(data.logo_url ?? null)
      setPub(data.published ?? false)
      setShopId(data.id)
    } catch {
      setError('Não foi possível carregar a barbearia. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [user.barbershopId])

  useEffect(() => { load() }, [load])

  const set = (k: keyof Form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  // ── CEP → ViaCEP ─────────────────────────────────────────────
  // O CEP é a porta de entrada do endereço: os demais campos ficam
  // bloqueados até a consulta preencher tudo sozinha. Se a barbearia já
  // tem endereço salvo (ou o CEP não existe na base), destrava para edição.
  const hasAddress      = !!(initial.street.trim() || initial.city.trim() || initial.district.trim())
  const addressUnlocked = hasAddress || cepStatus === 'ok' || cepStatus === 'error'
                       || cnpjStatus === 'ok' || cnpjStatus === 'inactive'

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8)
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
  }

  const onZipChange = async (raw: string) => {
    const masked = formatCep(raw)
    setForm(p => ({ ...p, zip: masked }))

    const digits = masked.replace(/\D/g, '')
    if (digits.length !== 8) {
      if (cepStatus === 'ok' || cepStatus === 'error') setCepStatus('idle')
      return
    }

    setCepStatus('loading')
    const r = await lookupCep(digits)
    if (!r) { setCepStatus('error'); return } // libera preenchimento manual
    setForm(p => ({
      ...p,
      street:   r.street   || p.street,
      district: r.district || p.district,
      city:     r.city     || p.city,
      state:    r.state    || p.state,
    }))
    setCepStatus('ok')
  }

  // ── CNPJ → BrasilAPI ─────────────────────────────────────────
  // Opcional. Quando preenchido, puxa razão social, nome fantasia, telefone
  // e endereço completo — o caminho rápido para quem tem empresa formalizada.
  const onCnpjChange = async (raw: string) => {
    const masked = formatCnpj(raw)
    setForm(p => ({ ...p, cnpj: masked }))
    if (!isCnpjComplete(masked)) {
      if (cnpjStatus !== 'idle') setCnpjStatus('idle')
      return
    }

    setCnpjStatus('loading')
    const r = await lookupCnpj(masked)
    if (!r) { setCnpjStatus('error'); return }
    setForm(p => ({
      ...p,
      legalName: r.legalName || p.legalName,
      name:      p.name.trim()  || r.tradeName || r.legalName,
      phone:     p.phone.trim() || r.phone,
      street:    r.street   || p.street,
      number:    r.number   || p.number,
      district:  r.district || p.district,
      city:      r.city     || p.city,
      state:     r.state    || p.state,
      zip:       r.zip ? formatCep(r.zip) : p.zip,
    }))
    setCnpjStatus(r.active ? 'ok' : 'inactive')
  }

  const lockedStyle = addressUnlocked
    ? inputStyle
    : { ...inputStyle, opacity: 0.4, cursor: 'not-allowed' }

  const missing    = REQUIRED.filter(k => !form[k].trim())
  const canPublish = missing.length === 0
  const dirty      = (Object.keys(form) as (keyof Form)[]).some(k => form[k].trim() !== initial[k].trim())

  const persist = async (patch: Record<string, unknown>) => {
    if (!shopId) return { error: new Error('Barbearia não encontrada') }
    return supabase.from('barbershops').update(patch).eq('id', shopId)
  }

  const save = async () => {
    if (!form.name.trim()) { setError('O nome da barbearia é obrigatório.'); return }
    setSaving(true); setError('')

    const { error: err } = await persist({
      name:             form.name.trim(),
      description:      form.description.trim() || null,
      phone:            form.phone.trim() || null,
      cnpj:             form.cnpj.trim() || null,
      legal_name:       form.legalName.trim() || null,
      address_street:   form.street.trim() || null,
      address_number:   form.number.trim() || null,
      address_district: form.district.trim() || null,
      address_city:     form.city.trim() || null,
      address_state:    form.state.trim() || null,
      address_zip:      form.zip.trim() || null,
    })
    setSaving(false)
    if (err) { setError('Erro ao salvar. Tente novamente.'); return }

    setInitial(form)
    // O nome aparece no cabeçalho do dashboard — precisa refletir na hora
    onUpdate({ ...user, barbershopName: form.name.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const togglePublish = async () => {
    const next = !published
    if (next && !canPublish) return
    // Salva junto: publicar com o formulário sujo colocaria na vitrine dados
    // diferentes dos que estão na tela.
    if (dirty) await save()
    const { error: err } = await persist({ published: next })
    if (err) { setError('Erro ao alterar a publicação.'); return }
    setPub(next)
  }

  const saveLogo = async (url: string | null) => {
    setLogoUrl(url)
    const { error: err } = await persist({ logo_url: url })
    if (err) setError('Erro ao salvar a imagem.')
  }

  if (loading) return (
    <p className="text-center py-16" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>Carregando…</p>
  )

  if (!user.barbershopId) return (
    <p className="text-center py-16" style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px' }}>
      Nenhuma barbearia vinculada a esta conta.
    </p>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px,6vw,38px)', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
          Minha Barbearia
        </h1>
        <p style={{ color: 'rgba(113,113,122,0.68)', fontSize: '13px', marginTop: '4px' }}>
          Estes dados são o que o cliente vê ao procurar por você
        </p>
      </div>

      {/* Status da vitrine */}
      <div className="rounded-2xl p-5"
        style={{
          background: published ? 'rgba(74,222,128,0.05)' : 'rgba(212,175,55,0.04)',
          border: `1px solid ${published ? 'rgba(74,222,128,0.2)' : 'rgba(212,175,55,0.18)'}`,
        }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {published
              ? <Eye size={16} style={{ color: '#4ade80', marginTop: 2, flexShrink: 0 }} />
              : <EyeOff size={16} style={{ color: '#D4AF37', marginTop: 2, flexShrink: 0 }} />}
            <div className="min-w-0">
              <div style={{ fontSize: '13px', fontWeight: 600, color: published ? '#4ade80' : '#D4AF37' }}>
                {published ? 'Visível para clientes' : 'Fora da vitrine'}
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(161,161,170,0.82)', marginTop: '3px', lineHeight: 1.5 }}>
                {published
                  ? 'Sua barbearia aparece na busca e pode receber agendamentos.'
                  : canPublish
                    ? 'Está tudo preenchido. Publique para começar a receber agendamentos.'
                    : 'Complete o endereço para poder publicar.'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={canPublish || published ? { scale: 1.03 } : {}}
            whileTap={canPublish || published ? { scale: 0.97 } : {}}
            onClick={togglePublish}
            disabled={!published && !canPublish}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
            style={{
              background: published ? 'rgba(255,255,255,0.05)' : canPublish ? 'linear-gradient(135deg, #B8951F, #D4AF37)' : 'rgba(255,255,255,0.03)',
              color:      published ? 'rgba(161,161,170,0.86)' : canPublish ? '#000' : 'rgba(113,113,122,0.46)',
              cursor:     published || canPublish ? 'pointer' : 'not-allowed',
            }}>
            {published ? 'Despublicar' : 'Publicar'}
          </motion.button>
        </div>

        {!canPublish && (
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <AlertCircle size={11} style={{ color: 'rgba(113,113,122,0.64)', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.68)' }}>
              Falta preencher: {missing.map(m => FIELD_LABELS[m]).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Identidade */}
      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {shopId && (
          <ImageUpload
            folder={`shops/${shopId}`}
            url={logoUrl}
            fallback={form.name || 'Barbearia'}
            onChange={saveLogo}
            size={88}
            rounded="2xl"
            label="Logo da barbearia"
          />
        )}

        <div>
          <label className="flex items-center gap-1.5" style={labelStyle}>
            <Store size={11} /> Nome da barbearia
          </label>
          <input value={form.name} onChange={e => set('name')(e.target.value)}
            className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm" style={inputStyle} />
        </div>

        <div>
          <label className="flex items-center gap-1.5" style={labelStyle}>
            <FileText size={11} /> Descrição <span style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>(opcional)</span>
          </label>
          <textarea value={form.description} onChange={e => set('description')(e.target.value)}
            rows={2} placeholder="Ex: Barbearia clássica no coração do bairro, desde 2015."
            className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm resize-none" style={inputStyle} />
        </div>

        <div>
          <label className="flex items-center gap-1.5" style={labelStyle}>
            <Phone size={11} /> Telefone <span style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>(opcional)</span>
          </label>
          <input value={form.phone} onChange={e => set('phone')(e.target.value)}
            placeholder="(11) 99999-0000"
            className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm" style={inputStyle} />
        </div>

        <div>
          <label className="flex items-center gap-1.5" style={labelStyle}>
            <Building2 size={11} /> CNPJ <span style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>(opcional — preenche seus dados automaticamente)</span>
          </label>
          <div className="relative">
            <input value={form.cnpj} onChange={e => onCnpjChange(e.target.value)}
              placeholder="00.000.000/0000-00" inputMode="numeric"
              className="w-full mt-1.5 px-3 py-2.5 pr-8 rounded-xl outline-none text-sm" style={inputStyle} />
            <span className="absolute right-2.5" style={{ top: 'calc(50% - 4px)' }}>
              {cnpjStatus === 'loading' && <Loader2 size={13} className="animate-spin" style={{ color: '#D4AF37' }} />}
              {cnpjStatus === 'ok'       && <Check size={13} style={{ color: '#4ade80' }} />}
              {cnpjStatus === 'inactive' && <AlertCircle size={13} style={{ color: '#D4AF37' }} />}
              {cnpjStatus === 'error'    && <AlertCircle size={13} style={{ color: '#f87171' }} />}
            </span>
          </div>
          {cnpjStatus !== 'idle' && (
            <p style={{
              fontSize: '11px', marginTop: '6px', lineHeight: 1.5,
              color: cnpjStatus === 'error' ? '#f87171'
                   : cnpjStatus === 'inactive' ? '#D4AF37'
                   : cnpjStatus === 'ok' ? '#4ade80'
                   : 'rgba(113,113,122,0.7)',
            }}>
              {cnpjStatus === 'loading'  ? 'Consultando CNPJ…'
                : cnpjStatus === 'ok'       ? `Dados preenchidos${form.legalName ? ` — ${form.legalName}` : ''}. Confira o número e o resto.`
                : cnpjStatus === 'inactive' ? `Empresa com situação cadastral inativa na Receita${form.legalName ? ` — ${form.legalName}` : ''}. Os dados foram preenchidos mesmo assim.`
                : 'CNPJ não encontrado. Preencha os dados manualmente.'}
            </p>
          )}
        </div>
      </div>

      {/* Endereço */}
      <div className="rounded-2xl p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mb-1">
          <div className="flex items-center gap-2">
            <MapPin size={13} style={{ color: '#D4AF37' }} />
            <h3 style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, fontSize: '14px' }}>Endereço</h3>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(113,113,122,0.72)', marginTop: '4px' }}>
            Digite o CEP e o endereço se preenche sozinho.
          </p>
        </div>

        {/* CEP primeiro: é ele quem destrava os demais campos */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label style={labelStyle}>CEP</label>
            <div className="relative">
              <input value={form.zip} onChange={e => onZipChange(e.target.value)}
                placeholder="01310-100" inputMode="numeric"
                className="w-full mt-1.5 px-3 py-2.5 pr-8 rounded-xl outline-none text-sm"
                style={{
                  ...inputStyle,
                  borderColor: cepStatus === 'ok' ? 'rgba(74,222,128,0.35)'
                             : cepStatus === 'error' ? 'rgba(239,68,68,0.35)'
                             : 'rgba(212,175,55,0.3)',
                }} />
              <span className="absolute right-2.5" style={{ top: 'calc(50% - 4px)' }}>
                {cepStatus === 'loading' && (
                  <Loader2 size={13} className="animate-spin" style={{ color: '#D4AF37' }} />
                )}
                {cepStatus === 'ok' && <Check size={13} style={{ color: '#4ade80' }} />}
                {cepStatus === 'error' && <AlertCircle size={13} style={{ color: '#f87171' }} />}
              </span>
            </div>
          </div>
          <div className="col-span-2 flex items-end pb-1">
            <span style={{
              fontSize: '11px', lineHeight: 1.5,
              color: cepStatus === 'error' ? '#f87171'
                   : cepStatus === 'ok' ? '#4ade80'
                   : 'rgba(113,113,122,0.6)',
            }}>
              {cepStatus === 'loading' ? 'Buscando endereço…'
                : cepStatus === 'ok' ? 'Endereço encontrado! Confira e informe o número.'
                : cepStatus === 'error' ? 'CEP não encontrado — preencha o endereço manualmente.'
                : addressUnlocked ? '' : 'Os campos abaixo destravam após o CEP.'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label style={labelStyle}>Rua</label>
            <input value={form.street} onChange={e => set('street')(e.target.value)}
              placeholder={addressUnlocked ? 'Av. Paulista' : 'Preencha o CEP primeiro'}
              disabled={!addressUnlocked}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm" style={lockedStyle} />
          </div>
          <div>
            <label style={labelStyle}>Número</label>
            <input value={form.number} onChange={e => set('number')(e.target.value)}
              placeholder={addressUnlocked ? '1000' : '—'}
              disabled={!addressUnlocked}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm" style={lockedStyle} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label style={labelStyle}>Bairro</label>
            <input value={form.district} onChange={e => set('district')(e.target.value)}
              placeholder={addressUnlocked ? 'Bela Vista' : '—'}
              disabled={!addressUnlocked}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm" style={lockedStyle} />
          </div>
          <div>
            <label style={labelStyle}>Cidade</label>
            <input value={form.city} onChange={e => set('city')(e.target.value)}
              placeholder={addressUnlocked ? 'São Paulo' : '—'}
              disabled={!addressUnlocked}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm" style={lockedStyle} />
          </div>
          <div>
            <label style={labelStyle}>UF</label>
            {/* Select em vez de texto: UF errada some da busca por cidade/estado */}
            <select value={form.state} onChange={e => set('state')(e.target.value)}
              disabled={!addressUnlocked}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none text-sm"
              style={{ ...lockedStyle, colorScheme: 'dark' }}>
              <option value="">—</option>
              {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
      </div>

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
          background: saved ? 'rgba(74,222,128,0.12)' : dirty ? 'linear-gradient(135deg, #B8951F, #D4AF37)' : 'rgba(255,255,255,0.04)',
          color:      saved ? '#4ade80' : dirty ? '#000' : 'rgba(113,113,122,0.52)',
          border:     saved ? '1px solid rgba(74,222,128,0.3)' : '1px solid transparent',
          cursor:     dirty && !saving ? 'pointer' : 'not-allowed',
        }}>
        <Check size={14} />
        {saved ? 'Salvo!' : saving ? 'Salvando…' : 'Salvar Alterações'}
      </motion.button>
    </div>
  )
}

const FIELD_LABELS: Record<string, string> = {
  name: 'nome', street: 'rua', district: 'bairro', city: 'cidade', state: 'UF',
}
