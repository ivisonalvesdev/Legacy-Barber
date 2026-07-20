import OneSignal from 'react-onesignal'
import { ONESIGNAL_APP_ID } from './integrations'

let initPromise: Promise<void> | null = null

/** Resolve com o valor da promise ou após `ms` — o que vier primeiro. Garante
 *  que nenhuma chamada do OneSignal pendure o fluxo principal do app. */
function withTimeout(p: Promise<unknown>, ms = 6000): Promise<void> {
  return Promise.race([
    p.then(() => undefined).catch(() => undefined),
    new Promise<void>(resolve => setTimeout(resolve, ms)),
  ])
}

/**
 * Inicializa o SDK Web do OneSignal (uma única vez). Sem app ID configurado,
 * não faz nada — push é opcional, nunca pode travar o app.
 */
export function initOneSignal(): Promise<void> {
  if (!ONESIGNAL_APP_ID) return Promise.resolve()
  if (!initPromise) {
    initPromise = withTimeout(OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    }))
  }
  return initPromise
}

/** Associa o dispositivo ao usuário logado, para notificações direcionadas. */
export async function identifyOneSignalUser(userId: string): Promise<void> {
  if (!ONESIGNAL_APP_ID) return
  try {
    await initOneSignal()
    await withTimeout(OneSignal.login(userId))
  } catch {
    // silencioso — mesma regra: push nunca quebra o fluxo principal
  }
}

/** Desassocia o dispositivo do usuário (chamar no logout). */
export async function resetOneSignalUser(): Promise<void> {
  if (!ONESIGNAL_APP_ID) return
  try {
    await OneSignal.logout()
  } catch {
    // silencioso
  }
}
