/**
 * ═══════════════════════════════════════════════════════════════
 *  Integrações externas — ponto único de configuração
 *
 *  Duas categorias:
 *   1. CLIENT-SAFE  — rodam no navegador, usam env VITE_* (públicas).
 *                     Ex.: ViaCEP, BrasilAPI, Google Places, webhook n8n.
 *   2. SERVER-SIDE  — WhatsApp, pagamento, e-mail, push. Usam SEGREDOS que
 *                     NUNCA podem ir para o browser. A lógica delas vive no
 *                     n8n (planejado) ou em Supabase Edge Functions; aqui só
 *                     ficam documentadas e o app dispara eventos para o n8n.
 *
 *  Guia completo do que configurar: docs/INTEGRACOES.md
 * ═══════════════════════════════════════════════════════════════
 */

const env = import.meta.env

// URLs públicas (grátis, sem chave)
const VIACEP    = 'https://viacep.com.br/ws'
const BRASILAPI = 'https://brasilapi.com.br/api'

/** Webhook do n8n para onde o app dispara eventos (novo agendamento, etc). */
export const N8N_WEBHOOK_URL     = (env.VITE_N8N_WEBHOOK_URL     as string | undefined) ?? ''
export const GOOGLE_MAPS_API_KEY = (env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? ''
export const ONESIGNAL_APP_ID    = (env.VITE_ONESIGNAL_APP_ID    as string | undefined) ?? ''

/** Quais integrações client-safe já têm as chaves configuradas. */
export const integrationStatus = {
  viacep:      true,                       // pública, sempre disponível
  brasilapi:   true,                       // pública, sempre disponível
  n8n:         !!N8N_WEBHOOK_URL,
  googleMaps:  !!GOOGLE_MAPS_API_KEY,
  onesignal:   !!ONESIGNAL_APP_ID,
} as const

// ─────────────────────────────────────────────────────────────────
//  ViaCEP — endereço a partir do CEP
// ─────────────────────────────────────────────────────────────────
export type CepResult = {
  street:   string
  district: string
  city:     string
  state:    string
}

/** Busca o endereço de um CEP (8 dígitos). Retorna null se inválido/erro. */
export async function lookupCep(cep: string): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const res  = await fetch(`${VIACEP}/${digits}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return {
      street:   data.logradouro ?? '',
      district: data.bairro     ?? '',
      city:     data.localidade ?? '',
      state:    data.uf         ?? '',
    }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
//  BrasilAPI — dados de empresa a partir do CNPJ
// ─────────────────────────────────────────────────────────────────
export type CnpjResult = {
  legalName:   string   // razão social
  tradeName:   string   // nome fantasia
  phone:       string
  street:      string
  number:      string
  district:    string
  city:        string
  state:       string
  zip:         string
  active:      boolean   // situação cadastral ativa
}

/** Formata "12ABC34501DE35" → só dígitos; valida 14 posições. */
const cnpjDigits = (v: string) => v.replace(/\D/g, '').slice(0, 14)

export const isCnpjComplete = (v: string) => cnpjDigits(v).length === 14

/** Máscara visual: 00.000.000/0000-00 */
export function formatCnpj(v: string): string {
  const d = cnpjDigits(v)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

/** Busca dados cadastrais de um CNPJ na BrasilAPI. null se inválido/erro. */
export async function lookupCnpj(cnpj: string): Promise<CnpjResult | null> {
  const digits = cnpjDigits(cnpj)
  if (digits.length !== 14) return null
  try {
    const res = await fetch(`${BRASILAPI}/cnpj/v1/${digits}`)
    if (!res.ok) return null
    const d = await res.json()
    const ddd = d.ddd_telefone_1 ? String(d.ddd_telefone_1).replace(/\D/g, '') : ''
    return {
      legalName: d.razao_social  ?? '',
      tradeName: d.nome_fantasia ?? '',
      phone:     ddd,
      street:    d.logradouro ?? '',
      number:    d.numero     ?? '',
      district:  d.bairro     ?? '',
      city:      d.municipio  ?? '',
      state:     d.uf         ?? '',
      zip:       d.cep ? String(d.cep).replace(/\D/g, '') : '',
      active:    (d.descricao_situacao_cadastral ?? '').toUpperCase() === 'ATIVA',
    }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
//  Eventos → n8n (base da automação: WhatsApp, e-mail, etc.)
// ─────────────────────────────────────────────────────────────────
export type AppEvent =
  | 'booking.created'
  | 'booking.cancelled'
  | 'barbershop.published'

/**
 * Dispara um evento para o webhook do n8n, se configurado. É "fire and
 * forget": nunca lança nem trava o fluxo — se o n8n estiver fora, o
 * agendamento continua salvo normalmente no Supabase.
 *
 * keepalive garante a entrega mesmo se a página navegar logo em seguida.
 */
export async function fireEvent(event: AppEvent, payload: Record<string, unknown>): Promise<void> {
  if (!N8N_WEBHOOK_URL) return
  try {
    await fetch(N8N_WEBHOOK_URL, {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify({ event, at: new Date().toISOString(), data: payload }),
      keepalive: true,
    })
  } catch {
    // silencioso de propósito — automação é acessório, não pode quebrar o app
  }
}
