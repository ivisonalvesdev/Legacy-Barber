// ═══════════════════════════════════════════════════════════════════════
//  notify-booking — Edge Function (Supabase / Deno)
//
//  Dispara uma notificação push (OneSignal) para o BARBEIRO e para o DONO
//  da barbearia quando um novo agendamento é criado. Roda no servidor do
//  Supabase, então guarda o segredo (ONESIGNAL_REST_API_KEY) com segurança —
//  ele NUNCA vai para o navegador.
//
//  Chamada pelo app logo após inserir o booking, com o id do agendamento.
//  A função relê o booking do banco (fonte da verdade) para não confiar em
//  dados vindos do cliente.
//
//  Secrets necessárias (supabase secrets set …):
//    ONESIGNAL_APP_ID
//    ONESIGNAL_REST_API_KEY
//    (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm do ambiente)
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405)

  try {
    const { bookingId } = await req.json()
    if (!bookingId) return json({ error: 'bookingId ausente' }, 400)

    const appId  = Deno.env.get('ONESIGNAL_APP_ID')
    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')
    if (!appId || !apiKey) return json({ error: 'OneSignal não configurado' }, 500)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Relê o agendamento do banco — fonte da verdade, não confia no cliente.
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, barber_id, barbershop_id, service_name, date, time, client_name, client:profiles!bookings_client_id_fkey(name)')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) return json({ error: 'Agendamento não encontrado' }, 404)

    // Descobre o dono da barbearia (pode ser o mesmo barbeiro — dedup abaixo).
    const { data: shop } = await supabase
      .from('barbershops')
      .select('owner_id, name')
      .eq('id', booking.barbershop_id)
      .single()

    // external_ids que devem receber o aviso: barbeiro + dono, sem repetir.
    const targets = [...new Set(
      [booking.barber_id, shop?.owner_id].filter((v): v is string => !!v)
    )]
    if (targets.length === 0) return json({ ok: true, skipped: 'sem destinatários' })

    // deno-lint-ignore no-explicit-any
    const clientName = (booking as any).client?.name ?? booking.client_name ?? 'Um cliente'
    const [y, m, d]  = String(booking.date).split('-')
    const dataBR     = d && m && y ? `${d}/${m}/${y}` : booking.date

    const payload = {
      app_id: appId,
      include_aliases: { external_id: targets },
      target_channel: 'push',
      headings: { en: '✂️ Novo agendamento!', pt: '✂️ Novo agendamento!' },
      contents: {
        en: `${clientName} agendou ${booking.service_name} — ${dataBR} às ${booking.time}.`,
        pt: `${clientName} agendou ${booking.service_name} — ${dataBR} às ${booking.time}.`,
      },
      // Ao clicar, abre o painel da barbearia.
      url: Deno.env.get('APP_URL') ?? undefined,
    }

    const res = await fetch('https://api.onesignal.com/notifications', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const result = await res.json()
    if (!res.ok) return json({ error: 'Falha no OneSignal', detail: result }, 502)

    return json({ ok: true, recipients: targets.length, onesignal: result.id ?? null })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
