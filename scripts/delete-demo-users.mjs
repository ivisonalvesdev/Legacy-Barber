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

// Contas fixas + os figurantes gerados por seed-demo-data.mjs (barber2.demo,
// client01.demo…), que são descobertos pelo sufixo .demo@legacybarber.com.
const DEMO_SUFFIX = '.demo@legacybarber.com'
const DEV_EMAIL   = 'admin@legacybarber.com'
// Donos primeiro: o cascade leva barbershop → bookings/products/services junto.
const OWNERS_FIRST = [DEV_EMAIL, `admin${DEMO_SUFFIX}`]

async function listAllUsers() {
  const all = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`Erro ao listar usuários: ${error.message}`)
    all.push(...data.users)
    if (data.users.length < 1000) return all
  }
}

async function main() {
  console.log('\n🗑️   Removendo contas...\n')

  const existing = await listAllUsers()
  const targets  = existing.filter(u => u.email === DEV_EMAIL || u.email?.endsWith(DEMO_SUFFIX))

  if (targets.length === 0) {
    console.log('  ⚠️  Nenhuma conta demo encontrada (já removidas?)\n')
    return
  }

  targets.sort((a, b) => {
    const rank = e => { const i = OWNERS_FIRST.indexOf(e); return i === -1 ? OWNERS_FIRST.length : i }
    return rank(a.email) - rank(b.email)
  })

  for (const user of targets) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      console.error(`  ❌  Erro ao remover ${user.email}: ${error.message}`)
      continue
    }
    console.log(`  ✅  Removido: ${user.email}`)
  }

  console.log('\n═'.repeat(58))
  console.log('  ✅  Concluído.\n')
}

main().catch(err => {
  console.error('\n❌  Erro:', err.message)
  process.exit(1)
})
