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
})
