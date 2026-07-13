import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import type { AppUser, Product } from '../../types'
import { supabase } from '../../lib/supabase'

interface BarberInsumosViewProps {
  user: AppUser
}

export function BarberInsumosView({ user }: BarberInsumosViewProps) {
  const [inv, setInv]         = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg]   = useState('')

  useEffect(() => {
    if (!user.barbershopId) { setLoading(false); return }
    supabase
      .from('products')
      .select('id, name, category, stock, max_stock, unit, cost')
      .eq('barbershop_id', user.barbershopId)
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          setErrMsg('Não foi possível carregar os insumos. Peça ao proprietário para executar o setup do banco.')
        } else {
          setInv((data ?? []).map(p => ({
            id:       p.id,
            name:     p.name,
            category: p.category,
            stock:    p.stock,
            maxStock: p.max_stock,
            unit:     p.unit,
            cost:     Number(p.cost),
          })))
        }
        setLoading(false)
      })
  }, [user.barbershopId])

  const consumeOne = async (item: Product) => {
    if (item.stock <= 0) return
    const newStock = item.stock - 1
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', item.id)
    if (!error) setInv(p => p.map(i => i.id === item.id ? { ...i, stock: newStock } : i))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
          Insumos
        </h1>
        <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
          Dê baixa nos produtos conforme usar durante os atendimentos
        </p>
      </div>

      {errMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'rgba(248,113,113,0.9)' }}>{errMsg}</p>
        </div>
      )}

      {!loading && !errMsg && inv.length === 0 && (
        <p className="text-center py-8" style={{ color: 'rgba(113,113,122,0.5)', fontSize: '13px' }}>
          Nenhum insumo cadastrado. O proprietário gerencia o estoque na aba Estoque.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {inv.map((item, idx) => {
          const pct = (item.stock / item.maxStock) * 100
          const barColor = pct <= 25 ? '#ef4444' : pct <= 50 ? '#f59e0b' : '#D4AF37'
          return (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: '10px', color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{item.category}</div>
              <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontSize: '13px', marginBottom: '10px', lineHeight: 1.3 }}>{item.name}</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span style={{ fontSize: '20px', fontWeight: 700, color: pct <= 25 ? '#f87171' : '#D4AF37' }}>{item.stock}</span>
                <span style={{ fontSize: '11px', color: 'rgba(113,113,122,0.5)' }}>/ {item.maxStock} {item.unit}</span>
              </div>
              <div className="rounded-full overflow-hidden mb-3" style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: '9999px', background: barColor }} />
              </div>
              <button onClick={() => consumeOne(item)} disabled={item.stock <= 0}
                className="w-full py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: item.stock <= 0 ? 'rgba(113,113,122,0.3)' : 'rgba(113,113,122,0.65)',
                  cursor: item.stock <= 0 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (item.stock <= 0) return; const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(239,68,68,0.42)'; b.style.color = '#f87171'; b.style.background = 'rgba(239,68,68,0.06)' }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.07)'; b.style.color = item.stock <= 0 ? 'rgba(113,113,122,0.3)' : 'rgba(113,113,122,0.65)'; b.style.background = 'transparent' }}>
                {item.stock <= 0 ? 'Esgotado' : 'Usar 1 unidade'}
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
