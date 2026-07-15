import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { Avatar } from './Avatar'
import { supabase } from '../../lib/supabase'

interface ImageUploadProps {
  /** Pasta do dono no bucket: `users/{id}` ou `shops/{id}` — as policies do Storage validam este prefixo. */
  folder:    string
  url?:      string | null
  fallback:  string
  onChange:  (url: string | null) => void
  size?:     number
  rounded?:  'full' | 'xl' | '2xl'
  label?:    string
}

const BUCKET   = 'avatars'
const MAX_SIDE = 512   // suficiente para exibir; corta o peso da foto de celular

/**
 * Corta o centro em quadrado e reduz para MAX_SIDE, devolvendo JPEG.
 * Foto de celular tem vários MB e passaria do limite do bucket; além disso,
 * o recorte evita que a imagem apareça esticada no avatar.
 */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side   = Math.min(bitmap.width, bitmap.height)
  const target = Math.min(side, MAX_SIDE)

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = target
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')

  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
    0, 0, target, target,
  )
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Falha ao processar a imagem'))),
      'image/jpeg', 0.85,
    )
  })
}

export function ImageUpload({
  folder, url, fallback, onChange, size = 96, rounded = 'xl', label = 'Foto',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  // Nome fixo + upsert: a troca sobrescreve em vez de acumular arquivo órfão.
  const path = `${folder}/avatar.jpg`

  const pick = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Selecione uma imagem.'); return }

    setBusy(true); setError('')
    try {
      const blob = await toSquareJpeg(file)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      // ?v= força o navegador a buscar de novo: o caminho não muda entre trocas.
      onChange(`${data.publicUrl}?v=${Date.now()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar a imagem.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async () => {
    setBusy(true); setError('')
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove([path])
    setBusy(false)
    if (rmErr) { setError('Erro ao remover a imagem.'); return }
    onChange(null)
  }

  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
        {label}
      </p>

      <div className="flex items-center gap-4">
        <div className="relative" style={{ width: size, height: size }}>
          <Avatar url={url} fallback={fallback} size={size} rounded={rounded} highlight />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)', borderRadius: rounded === 'full' ? '9999px' : '12px' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={18} style={{ color: '#D4AF37' }} />
              </motion.div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <motion.button
            whileHover={busy ? {} : { scale: 1.03 }} whileTap={busy ? {} : { scale: 0.97 }}
            onClick={() => inputRef.current?.click()} disabled={busy}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium"
            style={{
              background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)',
              color: '#D4AF37', cursor: busy ? 'not-allowed' : 'pointer',
            }}>
            <Camera size={13} /> {url ? 'Trocar imagem' : 'Enviar imagem'}
          </motion.button>

          {url && (
            <button onClick={remove} disabled={busy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs"
              style={{ color: 'rgba(239,68,68,0.75)', cursor: busy ? 'not-allowed' : 'pointer' }}>
              <Trash2 size={12} /> Remover
            </button>
          )}

          <p style={{ fontSize: '10px', color: 'rgba(113,113,122,0.45)' }}>
            JPG, PNG ou WEBP · recortada em quadrado
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs" style={{ color: '#f87171' }}>{error}</p>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
        onChange={e => pick(e.target.files?.[0])} />
    </div>
  )
}
