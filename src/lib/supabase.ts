import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  as string
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  throw new Error('Supabase env vars not set — check your .env file')
}

// Lock no-op: por padrão o supabase-js usa o Navigator LockManager para
// sincronizar a sessão entre abas. Esse lock trava o app ("preloader eterno"
// ao dar refresh logado) quando uma query é aguardada dentro do callback de
// onAuthStateChange, ou em contextos onde o LockManager não libera. Como este
// app é single-tab, executamos a operação direto, sem lock — elimina o
// deadlock na origem.
const noOpLock = async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn()

// Lê o access_token direto do storage onde o supabase-js persiste a sessão.
// Usado pelo Realtime (accessToken) sem referenciar o próprio client — evita a
// referência circular que quebraria a inferência de tipos.
const STORAGE_KEY = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
const readToken = async (): Promise<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.access_token) return parsed.access_token as string
    }
  } catch { /* storage indisponível — cai no anon */ }
  return key
}

// Sessão persistente explícita: o login fica salvo no navegador (localStorage)
// e o token renova sozinho — o usuário só sai quando clica em "Sair".
// detectSessionInUrl processa o link de confirmação de e-mail: ao clicar no
// e-mail, o usuário volta para o app já autenticado.
export const supabase = createClient(url, key, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    lock:               noOpLock,
  },
  // JWT do usuário para TODAS as camadas, inclusive o WebSocket do Realtime.
  // Lê do storage (não do client) para evitar circularidade. Sem isto o socket
  // abre só com a anon key e a RLS de bookings barra os eventos.
  accessToken: readToken,
})
