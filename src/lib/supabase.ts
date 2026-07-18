import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  as string
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  throw new Error('Supabase env vars not set — check your .env file')
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
  },
})
