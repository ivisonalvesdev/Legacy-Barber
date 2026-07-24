import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

export interface RealtimeTable {
  table:   string
  /** filtro postgres_changes, ex.: `barbershop_id=eq.${id}` (opcional) */
  filter?: string
}

/**
 * Mantém uma tela "ao vivo": assina mudanças (INSERT/UPDATE/DELETE) das tabelas
 * indicadas e chama `onChange` a cada evento. Um polling de reserva garante que
 * a tela continue atualizando mesmo em redes que bloqueiam WebSocket
 * (firewall/antivírus com inspeção SSL) — o caso de uma TV na barbearia.
 *
 * Retorna `live` = true quando o canal realtime está conectado (o selo fica
 * verde "AO VIVO"); false quando só o polling está segurando (âmbar).
 *
 * `channelName` null/'' desliga tudo (ex.: enquanto não há barbershopId).
 */
export function useRealtimeRefresh(
  channelName: string | null,
  tables: RealtimeTable[],
  onChange: () => void,
  pollMs = 45000,
): boolean {
  const [live, setLive] = useState(false)

  // onChange guardado em ref: a identidade dele muda a cada render, mas não
  // queremos reassinar o canal por isso — só quando o alvo (canal/tabelas) muda.
  // O ref é atualizado num effect (nunca durante o render).
  const cbRef = useRef(onChange)
  useEffect(() => { cbRef.current = onChange }, [onChange])

  const tablesKey = JSON.stringify(tables)

  useEffect(() => {
    if (!channelName) return
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const connect = async () => {
      // Autentica o Realtime com o JWT do usuário antes de assinar — sem isso a
      // RLS pode barrar os eventos e nada chega.
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      await supabase.realtime.setAuth(data.session?.access_token ?? null)
      if (cancelled) return

      let failures = 0
      let ch = supabase.channel(channelName)
      for (const t of tables) {
        ch = ch.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: t.table, ...(t.filter ? { filter: t.filter } : {}) },
          () => { cbRef.current() },
        )
      }
      channel = ch.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          failures = 0
          setLive(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setLive(false)
          failures += 1
          // Após algumas falhas, desiste do socket — o polling assume e o
          // console não vira um loop de reconexão.
          if (failures >= 3 && channel) { supabase.removeChannel(channel); channel = null }
        }
      })
    }
    void connect()

    const poll = setInterval(() => { cbRef.current() }, pollMs)

    return () => {
      cancelled = true
      clearInterval(poll)
      if (channel) supabase.removeChannel(channel)
    }
  }, [channelName, tablesKey, pollMs])

  return live
}
