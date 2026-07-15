/**
 * ═══════════════════════════════════════════════════════════════
 *  Script de criação de usuários demo + conta do desenvolvedor
 *  Rodar UMA ÚNICA VEZ:
 *    node --env-file=.env scripts/create-demo-users.mjs
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'COLE_AQUI_SUA_SERVICE_ROLE_KEY') {
  console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY não configurada no .env\n')
  console.error('   Acesse: Supabase Dashboard → Settings → API → service_role (secret)\n')
  process.exit(1)
}

// Admin client com permissão total (service_role bypassa RLS)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Credenciais ────────────────────────────────────────────────
const ACCOUNTS = {
  dev: {
    email:    'admin@legacybarber.com',
    password: 'LgcyAdmin#2024',
    meta: { name: 'Ivison Alves', role: 'admin', phone: '11999990000' },
    shopName: 'Legacy Barber',
  },
  adminDemo: {
    email:    'admin.demo@legacybarber.com',
    password: 'Demo@2024',
    meta: { name: 'Admin Demo', role: 'admin', phone: '11999990010' },
    shopName: 'Limabarber',
  },
  barberDemo: {
    email:    'barber.demo@legacybarber.com',
    password: 'Demo@2024',
    meta: { name: 'Carlos Demo', role: 'barber', phone: '11999990011', specialty: 'Degradê & Textura' },
  },
  clientDemo: {
    email:    'client.demo@legacybarber.com',
    password: 'Demo@2024',
    meta: { name: 'Pedro Cliente', role: 'client', phone: '11999990012' },
  },
}

// ─── Helpers ────────────────────────────────────────────────────
async function createUser(account) {
  // Deleta conta anterior com mesmo e-mail (seguro re-rodar o script)
  const { data: existing } = await admin.auth.admin.listUsers()
  const old = existing?.users?.find(u => u.email === account.email)
  if (old) {
    await admin.auth.admin.deleteUser(old.id)
    console.log(`  ♻️  Conta anterior removida: ${account.email}`)
  }

  const { data, error } = await admin.auth.admin.createUser({
    email:          account.email,
    password:       account.password,
    email_confirm:  true,            // confirma e-mail automaticamente
    user_metadata:  account.meta,
  })

  if (error) throw new Error(`Erro ao criar ${account.email}: ${error.message}`)
  console.log(`  ✅  Criado: ${account.email}`)
  return data.user
}

async function createShop(name, ownerId) {
  const { data, error } = await admin
    .from('barbershops')
    .insert({ name, owner_id: ownerId })
    .select('id, invite_code')
    .single()
  if (error) throw new Error(`Erro ao criar barbearia "${name}": ${error.message}`)
  return data
}

async function linkToShop(userId, shopId) {
  const { error } = await admin
    .from('profiles')
    .update({ barbershop_id: shopId })
    .eq('id', userId)
  if (error) throw new Error(`Erro ao vincular perfil ${userId}: ${error.message}`)
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  Criando contas de demo + desenvolvedor...\n')

  // ── Conta do desenvolvedor (Ivison) ──────────────────────────
  console.log('📌  Conta do desenvolvedor:')
  const devUser = await createUser(ACCOUNTS.dev)
  // Aguarda trigger criar o perfil
  await new Promise(r => setTimeout(r, 1200))
  const devShop = await createShop(ACCOUNTS.dev.shopName, devUser.id)
  await linkToShop(devUser.id, devShop.id)
  console.log(`     Barbearia: "${ACCOUNTS.dev.shopName}"`)
  console.log(`     Código convite: ${devShop.invite_code}\n`)

  // ── Admin Demo ───────────────────────────────────────────────
  console.log('🏪  Admin Demo:')
  const adminUser = await createUser(ACCOUNTS.adminDemo)
  await new Promise(r => setTimeout(r, 1200))
  const demoShop = await createShop(ACCOUNTS.adminDemo.shopName, adminUser.id)
  await linkToShop(adminUser.id, demoShop.id)
  console.log(`     Barbearia: "${ACCOUNTS.adminDemo.shopName}"`)
  console.log(`     Código convite: ${demoShop.invite_code}\n`)

  // ── Barbeiro Demo ────────────────────────────────────────────
  console.log('✂️   Barbeiro Demo:')
  const barberUser = await createUser(ACCOUNTS.barberDemo)
  await new Promise(r => setTimeout(r, 1200))
  await linkToShop(barberUser.id, demoShop.id)
  console.log(`     Vinculado à: "${ACCOUNTS.adminDemo.shopName}"\n`)

  // ── Cliente Demo ─────────────────────────────────────────────
  console.log('👤  Cliente Demo:')
  await createUser(ACCOUNTS.clientDemo)
  console.log()

  // ── Resumo final ─────────────────────────────────────────────
  console.log('═'.repeat(58))
  console.log('  ✅  TUDO CRIADO COM SUCESSO\n')

  console.log('  🔐  CONTA DO DESENVOLVEDOR (só você sabe):')
  console.log(`      E-mail : admin@legacybarber.com`)
  console.log(`      Senha  : LgcyAdmin#2024`)
  console.log(`      Role   : Admin (proprietário)\n`)

  console.log('  🎭  CONTAS DEMO (para mostrar ao cliente):')
  console.log(`      Admin   → admin.demo@legacybarber.com  /  Demo@2024`)
  console.log(`      Barbeiro → barber.demo@legacybarber.com  /  Demo@2024`)
  console.log(`      Cliente  → client.demo@legacybarber.com  /  Demo@2024\n`)

  console.log('  📝  OBSERVAÇÃO:')
  console.log('      Os dados mock (estoque, agenda) aparecem automaticamente.')
  console.log('      Quando o cliente real criar a conta, verá tudo zerado.')
  console.log('═'.repeat(58) + '\n')
}

main().catch(err => {
  console.error('\n❌  Erro:', err.message)
  process.exit(1)
})
