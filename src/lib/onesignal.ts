import OneSignal from 'react-onesignal'
import { ONESIGNAL_APP_ID } from './integrations'

let initPromise: Promise<void> | null = null

/**
 * Inicializa o SDK Web do OneSignal (uma única vez). Sem app ID configurado,
 * não faz nada — push é opcional, nunca pode travar o app.
 */
export function initOneSignal(): Promise<void> {
  if (!ONESIGNAL_APP_ID) return Promise.resolve()
  if (!initPromise) {
    initPromise = OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    }).catch(() => { /* push é acessório — falha aqui não pode quebrar o app */ })
  }
  return initPromise
}

/** Associa o dispositivo ao usuário logado, para notificações direcionadas. */
export async function identifyOneSignalUser(userId: string): Promise<void> {
  if (!ONESIGNAL_APP_ID) return
  try {
    await initOneSignal()
    await OneSignal.login(userId)
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
