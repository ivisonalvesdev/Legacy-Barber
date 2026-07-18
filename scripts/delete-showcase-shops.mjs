/**
 * ═══════════════════════════════════════════════════════════════
 *  Remove APENAS as barbearias de mostruário (vitrine) do banco:
 *  Barbearia do Zé, Navalha de Ouro e Corte & Cia — donos e barbeiros.
 *
 *  A Limabarber (admin.demo) e todos os clientes demo ficam intactos.
 *  Apagar o dono leva a barbearia junto (owner_id ON DELETE CASCADE),
 *  que por sua vez leva os serviços e produtos dela.
 *
 *  Rodar: node --env-file=.env scripts/delete-showcase-shops.mjs
 * ═══════════════════════════════════════════════════════════════
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

// Contas criadas pela antiga seção "SHOWCASE" do seed-demo-data.mjs.
// Donos primeiro: o cascade da barbearia sai junto com eles.
const SHOWCASE_EMAILS = [
  'shop2.demo@legacybarber.com',    // dona da Barbearia do Zé
  'shop3.demo@legacybarber.com',    // dono da Navalha de Ouro
  'shop4.demo@legacybarber.com',    // dona da Corte & Cia
  'ze1.demo@legacybarber.com',
  'ze2.demo@legacybarber.com',
  'navalha1.demo@legacybarber.com',
  'corte1.demo@legacybarber.com',
  'corte2.demo@legacybarber.com',
]

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
  console.log('\n🗑️   Removendo barbearias de mostruário...\n')

  const existing = await listAllUsers()
  const targets  = SHOWCASE_EMAILS
    .map(email => existing.find(u => u.email === email))
    .filter(Boolean)

  if (targets.length === 0) {
    console.log('  ✅  Nenhuma conta de mostruário encontrada — banco já está limpo.\n')
    return
  }

  for (const user of targets) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      console.error(`  ❌  Erro ao remover ${user.email}: ${error.message}`)
      continue
    }
    console.log(`  ✅  Removido: ${user.email}`)
  }

  console.log('\n' + '═'.repeat(58))
  console.log('  ✅  Mostruário removido — só a Limabarber segue na vitrine.')
  console.log('═'.repeat(58) + '\n')
}

main().catch(err => {
  console.error('\n❌  Erro:', err.message)
  process.exit(1)
})
