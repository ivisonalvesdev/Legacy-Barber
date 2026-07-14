/**
 * Remove as contas demo + conta do desenvolvedor criadas por create-demo-users.mjs.
 * Rodar: node --env-file=.env scripts/delete-demo-users.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY não configurada no .env\n')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Donos primeiro (cascade remove barbershop → bookings/products/services),
// depois barbeiro/cliente (que não têm mais bookings apontando pra eles).
const EMAILS_ORDER = [
  'admin@legacybarber.com',
  'admin.demo@legacybarber.com',
  'barber.demo@legacybarber.com',
  'client.demo@legacybarber.com',
]

async function main() {
  console.log('\n🗑️   Removendo contas...\n')

  const { data: existing, error: listError } = await admin.auth.admin.listUsers()
  if (listError) throw new Error(`Erro ao listar usuários: ${listError.message}`)

  for (const email of EMAILS_ORDER) {
    const user = existing.users.find(u => u.email === email)
    if (!user) {
      console.log(`  ⚠️  Não encontrado (já removido?): ${email}`)
      continue
    }
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      console.error(`  ❌  Erro ao remover ${email}: ${error.message}`)
      continue
    }
    console.log(`  ✅  Removido: ${email}`)
  }

  console.log('\n═'.repeat(58))
  console.log('  ✅  Concluído.\n')
}

main().catch(err => {
  console.error('\n❌  Erro:', err.message)
  process.exit(1)
})
