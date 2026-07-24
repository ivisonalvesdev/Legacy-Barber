import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { SiteBackground } from './SiteBackground'

/**
 * Fundo animado da marca — favo de mel dourado em canvas (portado do protótipo
 * do Figma Make). A luz percorre os hexágonos em loop perfeito de 16s.
 *
 * Estratégia de performance: a animação roda só no DESKTOP (ponteiro fino, tela
 * larga) e quando o usuário não pediu movimento reduzido. No celular e em
 * `prefers-reduced-motion` cai para o frame estático (WebP leve) — mesmo visual,
 * sem gastar bateria/CPU redesenhando centenas de hexágonos a 60fps.
 */

// ─── Constantes / helpers (verbatim do protótipo) ──────────────────────────
const LOOP_MS  = 16000
const HEX_SIZE  = 36
const GOLD_D: [number, number, number] = [184, 149, 31]
const GOLD_L: [number, number, number] = [240, 208, 96]

const lerp  = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const smoothstep = (lo: number, hi: number, x: number) => {
  const t = clamp((x - lo) / (hi - lo), 0, 1)
  return t * t * (3 - 2 * t)
}

interface Hex { cx: number; cy: number; elev: number; seed: number }

function buildGrid(w: number, h: number, size: number): Hex[] {
  const hexW = size * Math.sqrt(3)
  const hexH = size * 2
  const cols = Math.ceil(w / hexW) + 4
  const rows = Math.ceil(h / (hexH * 0.75)) + 4
  const hexes: Hex[] = []
  for (let row = -2; row < rows; row++) {
    for (let col = -2; col < cols; col++) {
      const cx = col * hexW + (row % 2 !== 0 ? hexW / 2 : 0)
      const cy = row * hexH * 0.75
      const raw = Math.abs(Math.sin(col * 127.1 + row * 311.7) * 43758.5453)
      const frac = raw - Math.floor(raw)
      const elev = frac < 0.18 ? frac * 28 : 0
      hexes.push({ cx, cy, elev, seed: frac })
    }
  }
  return hexes
}

function hexPts(cx: number, cy: number, size: number, elev: number) {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6
    pts.push({ x: cx + size * Math.cos(a), y: cy - elev + size * Math.sin(a) })
  }
  return pts
}

function renderScene(ctx: CanvasRenderingContext2D, grid: Hex[], t: number, size: number) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const diag = Math.sqrt(w * w + h * h)

  // Fundo — preto profundo com leve calor
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#0d0b07')
  bg.addColorStop(0.45, '#050505')
  bg.addColorStop(1, '#0a0806')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Duas luzes que varrem a grade — períodos harmônicos = loop perfeito
  const pA = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2
  const sAx = lerp(-w * 0.2, w * 1.2, pA)
  const sAy = lerp(-h * 0.2, h * 1.2, pA)
  const pB = (Math.sin(t * Math.PI * 4 + Math.PI * 0.25) + 1) / 2
  const sBx = lerp(w * 1.2, -w * 0.2, pB)
  const sBy = lerp(-h * 0.2, h * 1.2, pB)
  const breathe = ((Math.sin(t * Math.PI * 2 + Math.PI * 0.7) + 1) / 2) * 0.10

  for (const { cx, cy, elev } of grid) {
    const pts = hexPts(cx, cy, size, elev)

    const dTL = Math.sqrt(cx * cx + cy * cy)
    const dBR = Math.sqrt((cx - w) ** 2 + (cy - h) ** 2)
    const dA  = Math.sqrt((cx - sAx) ** 2 + (cy - sAy) ** 2)
    const dB  = Math.sqrt((cx - sBx) ** 2 + (cy - sBy) ** 2)

    const infTL = Math.pow(smoothstep(diag * 0.42, 0, dTL), 1.6) * 0.65
    const infBR = Math.pow(smoothstep(diag * 0.42, 0, dBR), 1.6) * 0.65
    const infA  = Math.pow(smoothstep(diag * 0.18, 0, dA), 2.2) * 1.8
    const infB  = Math.pow(smoothstep(diag * 0.14, 0, dB), 2.2) * 1.2
    const totalInf = clamp(infTL + infBR + infA + infB + breathe, 0, 1)

    // Face do hexágono — muito escura
    const fv = Math.round(5 + elev * 0.8 + totalInf * 12)
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.closePath()
    ctx.fillStyle = `rgba(${fv},${Math.round(fv * 0.85)},${Math.round(fv * 0.3)},0.94)`
    ctx.fill()

    // Sombra interna nos hexágonos elevados
    if (elev > 2) {
      ctx.save()
      ctx.clip()
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = elev * 1.8
      ctx.shadowOffsetY = elev * 0.6
      ctx.fillStyle = 'rgba(0,0,0,0)'
      ctx.fill()
      ctx.restore()
    }

    // Borda base (grade escura sempre presente)
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.closePath()
    ctx.strokeStyle = 'rgba(20,16,6,0.6)'
    ctx.lineWidth = 0.6
    ctx.stroke()

    // Borda iluminada — brilho dourado
    if (totalInf > 0.015) {
      const sweepDom = clamp((infA + infB) / 1.8, 0, 1)
      const cr = Math.round(lerp(GOLD_D[0], GOLD_L[0], sweepDom))
      const cg = Math.round(lerp(GOLD_D[1], GOLD_L[1], sweepDom))
      const cb = Math.round(lerp(GOLD_D[2], GOLD_L[2], sweepDom))
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.closePath()
      ctx.save()
      ctx.shadowColor = `rgba(${cr},${cg},${cb},${(totalInf * 0.7).toFixed(2)})`
      ctx.shadowBlur = 6 + totalInf * 10
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(totalInf * 0.88).toFixed(2)})`
      ctx.lineWidth = elev > 3 ? 1.8 : 1.1
      ctx.stroke()
      ctx.restore()
    }

    // Realce de bisel — duas arestas do topo dos hexágonos elevados
    if (elev > 3 && totalInf > 0.05) {
      const b = totalInf * 0.6
      ctx.beginPath()
      ctx.moveTo(pts[5].x, pts[5].y)
      ctx.lineTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[1].x, pts[1].y)
      ctx.save()
      ctx.shadowColor = `rgba(${GOLD_L[0]},${GOLD_L[1]},${GOLD_L[2]},${b.toFixed(2)})`
      ctx.shadowBlur = 4
      ctx.strokeStyle = `rgba(${GOLD_L[0]},${GOLD_L[1]},${GOLD_L[2]},${b.toFixed(2)})`
      ctx.lineWidth = 1.3
      ctx.stroke()
      ctx.restore()
    }

    // Aresta de sombra na base dos hexágonos elevados
    if (elev > 3) {
      ctx.beginPath()
      ctx.moveTo(pts[2].x, pts[2].y)
      ctx.lineTo(pts[3].x, pts[3].y)
      ctx.lineTo(pts[4].x, pts[4].y)
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 1.4
      ctx.stroke()
    }
  }

  // Halos nos cantos
  const tlG = ctx.createRadialGradient(0, 0, 0, 0, 0, diag * 0.48)
  tlG.addColorStop(0, 'rgba(240,185,40,0.10)')
  tlG.addColorStop(0.2, 'rgba(212,175,55,0.07)')
  tlG.addColorStop(0.5, 'rgba(184,149,31,0.03)')
  tlG.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = tlG
  ctx.fillRect(0, 0, w, h)

  const brG = ctx.createRadialGradient(w, h, 0, w, h, diag * 0.48)
  brG.addColorStop(0, 'rgba(212,175,55,0.10)')
  brG.addColorStop(0.2, 'rgba(184,149,31,0.06)')
  brG.addColorStop(0.5, 'rgba(160,130,20,0.025)')
  brG.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = brG
  ctx.fillRect(0, 0, w, h)

  // Blobs suaves acompanhando as luzes
  const blobA = ctx.createRadialGradient(sAx, sAy, 0, sAx, sAy, diag * 0.12)
  blobA.addColorStop(0, 'rgba(212,175,55,0.04)')
  blobA.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = blobA
  ctx.fillRect(0, 0, w, h)

  const blobB = ctx.createRadialGradient(sBx, sBy, 0, sBx, sBy, diag * 0.09)
  blobB.addColorStop(0, 'rgba(184,149,31,0.03)')
  blobB.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = blobB
  ctx.fillRect(0, 0, w, h)

  // Vinheta central — contraste para o texto
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.05, w / 2, h / 2, diag * 0.62)
  vig.addColorStop(0, 'rgba(0,0,0,0.45)')
  vig.addColorStop(0.55, 'rgba(0,0,0,0.18)')
  vig.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

export function HexBackground() {
  const reduced = useReducedMotion()
  const [animate, setAnimate] = useState(false)

  // Decide se anima: só desktop com ponteiro fino e sem movimento reduzido.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (pointer: fine)')
    const update = () => setAnimate(mq.matches && !reduced)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [reduced])

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!animate) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let grid: Hex[] = []
    let raf = 0
    let start = 0
    let last = 0
    const FRAME_MS = 1000 / 30   // 30fps: o sweep é lento, imperceptível vs 60

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      grid = buildGrid(canvas.width, canvas.height, HEX_SIZE)
    }
    resize()
    window.addEventListener('resize', resize)

    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick)
      if (ts - last < FRAME_MS) return      // trava em ~30fps
      last = ts
      if (!start) start = ts
      const t = ((ts - start) % LOOP_MS) / LOOP_MS
      renderScene(ctx, grid, t, HEX_SIZE)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [animate])

  // Fallback estático (mobile / movimento reduzido): frame WebP leve.
  if (!animate) return <SiteBackground />

  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, background: '#050505' }}>
      <canvas ref={canvasRef} className="absolute inset-0" style={{ width: '100%', height: '100%', display: 'block' }} />
      {/* Grão animado — dithering fininho que dá vida e mata banding */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23f)'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px',
          opacity: 0.038,
          mixBlendMode: 'overlay',
          animation: 'hexgrain 0.12s steps(1) infinite',
        }}
      />
    </div>
  )
}
