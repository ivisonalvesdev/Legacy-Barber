import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Search, AlertTriangle, X, Check } from 'lucide-react'
import { INVENTORY } from '../../data/mock'

type InvItem = typeof INVENTORY[number]

const CATEGORIES = ['Todos', 'Finalizador', 'Barba', 'Cabelo', 'Instrumental']

function StockBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-24 rounded-full overflow-hidden" style={{ height: '5px', background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9 }}
        style={{ height: '100%', borderRadius: '9999px', background: color, boxShadow: `0 0 6px ${color}66` }} />
    </div>
  )
}

export function AdminEstoqueView() {
  const [inv, setInv]         = useState<InvItem[]>(INVENTORY)
  const [search, setSearch]   = useState('')
  const [cat, setCat]         = useState('Todos')
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: 'Finalizador', stock: '', max: '', cost: '' })
  const [qtys, setQtys]       = useState<Record<number, string>>({})

  const getQty = (id: number) => Math.max(1, parseInt(qtys[id] ?? '1', 10) || 1)

  const adjust = (id: number, delta: number) => {
    const qty = getQty(id)
    setInv(p => p.map(i => i.id === id ? { ...i, stock: Math.max(0, Math.min(i.max, i.stock + delta * qty)) } : i))
  }

  const addItem = () => {
    if (!newItem.name || !newItem.stock || !newItem.max) return
    const item: InvItem = {
      id: Date.now(),
      name: newItem.name,
      category: newItem.category,
      stock: Number(newItem.stock),
      max:   Number(newItem.max),
      unit: 'un',
      cost:  Number(newItem.cost) || 0,
    }
    setInv(p => [item, ...p])
    setNewItem({ name: '', category: 'Finalizador', stock: '', max: '', cost: '' })
    setShowAdd(false)
  }

  const filtered = inv.filter(i => {
    const matchCat  = cat === 'Todos' || i.category === cat
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const lowStock  = inv.filter(i => (i.stock / i.max) <= 0.25).length
  const totalCost = inv.reduce((a, b) => a + b.stock * b.cost, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 700, color: 'white', lineHeight: 1.05 }}>
            Estoque
          </h1>
          <p style={{ color: 'rgba(113,113,122,0.55)', fontSize: '13px', marginTop: '4px' }}>
            {inv.length} produtos · Valor em estoque: R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37)', color: '#000' }}>
          <Plus size={13} /> Adicionar Produto
        </motion.button>
      </div>

      {/* Alertas de estoque baixo */}
      {lowStock > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'rgba(248,113,113,0.9)' }}>
            <strong>{lowStock} {lowStock === 1 ? 'produto' : 'produtos'}</strong> com estoque crítico (≤ 25%). Revise e reabasteça.
          </p>
        </motion.div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search size={14} style={{ color: 'rgba(113,113,122,0.5)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'rgba(255,255,255,0.8)', '::placeholder': { color: 'rgba(113,113,122,0.4)' } } as React.CSSProperties} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: cat === c ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${cat === c ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color:  cat === c ? '#D4AF37' : 'rgba(113,113,122,0.65)',
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Produto', 'Categoria', 'Estoque', 'Nível', 'Custo Unit.', 'Ajustar'].map(h => (
                <th key={h} className="px-5 py-3 text-left"
                  style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(113,113,122,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((item, idx) => {
                const pct      = (item.stock / item.max) * 100
                const barColor = pct <= 25 ? '#ef4444' : pct <= 50 ? '#f59e0b' : '#D4AF37'
                return (
                  <motion.tr key={item.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: idx * 0.04 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.012)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-5 py-3.5" style={{ color: 'rgba(255,255,255,0.88)', fontSize: '13px', fontWeight: 500 }}>
                      <div className="flex items-center gap-2">
                        {pct <= 25 && <AlertTriangle size={12} style={{ color: '#f87171', flexShrink: 0 }} />}
                        {item.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full"
                        style={{ fontSize: '10px', fontWeight: 600, background: 'rgba(255,255,255,0.04)', color: 'rgba(161,161,170,0.65)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono" style={{ fontSize: '13px' }}>
                      <span style={{ color: pct <= 25 ? '#f87171' : 'rgba(255,255,255,0.8)' }}>{item.stock}</span>
                      <span style={{ color: 'rgba(113,113,122,0.45)' }}> / {item.max} {item.unit}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StockBar pct={pct} color={barColor} />
                    </td>
                    <td className="px-5 py-3.5 font-mono" style={{ fontSize: '13px', color: 'rgba(113,113,122,0.55)' }}>
                      R$ {item.cost},00
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {/* Botão − */}
                        <button onClick={() => adjust(item.id, -1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all flex-shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.7)' }}
                          onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(239,68,68,0.4)'; b.style.color = '#f87171'; b.style.background = 'rgba(239,68,68,0.06)' }}
                          onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(113,113,122,0.7)'; b.style.background = 'transparent' }}>
                          −
                        </button>

                        {/* Input de quantidade */}
                        <input
                          type="number"
                          min="1"
                          value={qtys[item.id] ?? '1'}
                          onChange={e => setQtys(p => ({ ...p, [item.id]: e.target.value }))}
                          onFocus={e => e.currentTarget.select()}
                          className="font-mono text-center outline-none transition-all"
                          style={{
                            width: '42px', height: '28px', fontSize: '12px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            color: 'rgba(255,255,255,0.75)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}
                          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                        />

                        {/* Botão + */}
                        <button onClick={() => adjust(item.id, +1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all flex-shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.7)' }}
                          onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(212,175,55,0.4)'; b.style.color = '#D4AF37'; b.style.background = 'rgba(212,175,55,0.06)' }}
                          onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(113,113,122,0.7)'; b.style.background = 'transparent' }}>
                          +
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center"
                  style={{ color: 'rgba(113,113,122,0.4)', fontSize: '13px' }}>
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal — Adicionar Produto */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Package size={16} style={{ color: '#D4AF37' }} />
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: 'white' }}>
                    Novo Produto
                  </h3>
                </div>
                <button onClick={() => setShowAdd(false)} style={{ color: 'rgba(113,113,122,0.5)' }}>
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Nome do produto', key: 'name', placeholder: 'Ex: Pomada Matte Gold' },
                  { label: 'Custo unitário (R$)', key: 'cost', placeholder: '0,00', type: 'number' },
                  { label: 'Quantidade atual', key: 'stock', placeholder: '0', type: 'number' },
                  { label: 'Quantidade máxima', key: 'max', placeholder: '0', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {f.label}
                    </label>
                    <input
                      type={f.type || 'text'}
                      value={(newItem as Record<string, string>)[f.key]}
                      onChange={e => setNewItem(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(113,113,122,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Categoria
                  </label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}>
                    {['Finalizador', 'Barba', 'Cabelo', 'Instrumental'].map(c => (
                      <option key={c} value={c} style={{ background: '#0d0d0d' }}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(113,113,122,0.7)' }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={addItem}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-black"
                  style={{ background: 'linear-gradient(135deg,#B8951F,#D4AF37)' }}>
                  <Check size={14} /> Adicionar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
