/**
 * ═══════════════════════════════════════════════════════════════
 *  Seed de dados fictícios da barbearia demo — 6 meses de histórico
 *
 *  Popula equipe, clientes, agendamentos e estoque para que TODOS os
 *  gráficos e KPIs (Dashboard e Relatórios) fiquem preenchidos.
 *
 *  As datas são relativas a HOJE, então re-rode antes de gravar/demonstrar
 *  para "reidratar" o histórico:
 *    node --env-file=.env scripts/seed-demo-data.mjs
 *
 *  Seguro re-rodar: limpa os bookings da barbearia demo e recria tudo.
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'COLE_AQUI_SUA_SERVICE_ROLE_KEY') {
  console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY não configurada no .env')
  console.error('   Supabase Dashboard → Settings → API → service_role (secret)\n')
  process.exit(1)
}

// service_role bypassa RLS — o seed roda mesmo com o modo readonly ligado.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Configuração ───────────────────────────────────────────────
const OWNER_EMAIL   = 'admin.demo@legacybarber.com'
const DEMO_PASSWORD = 'Demo@2024'
const MONTHS_BACK   = 6
// Nome do mostruário: a barbearia demo é a "Limabarber" — todas as contas
// demo vivem dentro dela. Re-rodar o seed sempre reforça o nome.
const SHOP_NAME     = 'Limabarber'

// Espelha src/data/defaults.ts — a ocupação do dashboard divide por isto.
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:45', '10:30', '11:15',
  '13:00', '13:45', '14:30', '15:15', '16:00', '17:00', '18:00',
]

const BARBERS = [
  { email: 'barber.demo@legacybarber.com',  name: 'Carlos Demo',     specialty: 'Degradê & Textura' },
  { email: 'barber2.demo@legacybarber.com', name: 'Rafael Moreira',  specialty: 'Barba & Navalha'   },
  { email: 'barber3.demo@legacybarber.com', name: 'Diego Nunes',     specialty: 'Clássico & Social' },
]

// Endereço da barbearia principal — sem ele a busca do cliente não a encontra
// e o dono não consegue publicar.
const MAIN_ADDRESS = {
  description:      'A Limabarber é referência em corte e barba na Consolação desde 2015.',
  phone:            '(11) 3255-8800',
  address_street:   'Rua Augusta',
  address_number:   '1200',
  address_district: 'Consolação',
  address_city:     'São Paulo',
  address_state:    'SP',
  address_zip:      '01304-001',
}

const CLIENT_NAMES = [
  'Pedro Cliente', 'Lucas Andrade', 'Mateus Ribeiro', 'Bruno Carvalho',
  'Felipe Souza', 'Gustavo Lima', 'Rodrigo Pinto', 'André Barbosa',
  'Vinícius Rocha', 'Leonardo Dias', 'Marcelo Freitas', 'Henrique Costa',
  'Eduardo Martins', 'Fábio Nogueira', 'Ricardo Teixeira', 'Daniel Moura',
  'Thiago Cardoso', 'Gabriel Antunes', 'Caio Vasconcelos', 'Murilo Peixoto',
  'Otávio Bezerra', 'Sérgio Maciel', 'Renato Fontes', 'Alexandre Braga',
]
// O primeiro cliente reusa a conta demo divulgada; os demais são figurantes.
const clientEmail = i => (i === 0 ? 'client.demo@legacybarber.com' : `client${String(i).padStart(2, '0')}.demo@legacybarber.com`)

// Peso = probabilidade relativa de cada serviço ser escolhido.
const SERVICE_WEIGHTS = {
  'Corte + Barba':       34,
  'Corte Clássico':      28,
  'Barba Completa':      16,
  'Sobrancelha + Barba': 14,
  'Tratamento Capilar':   8,
}

const STOCK = [
  { name: 'Pomada Matte',         category: 'Finalizador',  stock: 34, max_stock: 120, unit: 'un', cost: 45 },
  { name: 'Óleo de Barba',        category: 'Barba',        stock: 9,  max_stock: 100, unit: 'un', cost: 38 },
  { name: 'Shampoo Profissional', category: 'Cabelo',       stock: 61, max_stock: 150, unit: 'un', cost: 55 },
  { name: 'Navalha Descartável',  category: 'Instrumental', stock: 240, max_stock: 500, unit: 'cx', cost: 12 },
  { name: 'Cera Modeladora',      category: 'Finalizador',  stock: 6,  max_stock: 80,  unit: 'un', cost: 42 },
  { name: 'Condicionador',        category: 'Cabelo',       stock: 48, max_stock: 120, unit: 'un', cost: 48 },
  { name: 'Talco Barbearia',      category: 'Barba',        stock: 27, max_stock: 90,  unit: 'un', cost: 22 },
  { name: 'Loção Pós-Barba',      category: 'Barba',        stock: 3,  max_stock: 70,  unit: 'un', cost: 59 },
]

// ─── RNG determinístico (mulberry32) ────────────────────────────
// Semente fixa: o histórico é sempre o mesmo entre execuções.
let seed = 0x5eed1234
const rnd = () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const randInt = (min, max) => min + Math.floor(rnd() * (max - min + 1))
const pick    = arr => arr[Math.floor(rnd() * arr.length)]

const iso = d => d.toISOString().split('T')[0]

// ─── Helpers de usuário ─────────────────────────────────────────
async function listAllUsers() {
  const all = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    all.push(...data.users)
    if (data.users.length < 1000) return all
  }
}

/** Cria o usuário se não existir; devolve o id. Não recria (preserva senha/ids). */
async function ensureUser(existing, { email, name, role, specialty, phone }) {
  const found = existing.find(u => u.email === email)
  if (found) return found.id

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role, phone, ...(specialty ? { specialty } : {}) },
  })
  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  return data.user.id
}

/** O trigger handle_new_user cria o profile; espera ele aparecer. */
async function waitForProfiles(ids) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data } = await admin.from('profiles').select('id').in('id', ids)
    if ((data?.length ?? 0) >= ids.length) return
    await new Promise(r => setTimeout(r, 500))
  }
  console.warn('  ⚠️  Alguns profiles demoraram a aparecer — seguindo mesmo assim.')
}

const weightedService = services => {
  const pool = services.flatMap(s => Array(SERVICE_WEIGHTS[s.name] ?? 10).fill(s))
  return pick(pool)
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  Semeando dados fictícios da barbearia demo...\n')

  const users = await listAllUsers()

  // ── 1. Barbearia demo ─────────────────────────────────────────
  const owner = users.find(u => u.email === OWNER_EMAIL)
  if (!owner) {
    console.error(`❌  Conta ${OWNER_EMAIL} não existe.`)
    console.error('   Rode antes: node --env-file=.env scripts/create-demo-users.mjs\n')
    process.exit(1)
  }

  // order + limit determinístico: se houver duplicata do mesmo dono, pega a
  // mais antiga (a original, que carrega o histórico) — nunca uma vazia.
  const { data: shop, error: shopErr } = await admin
    .from('barbershops').select('id, name').eq('owner_id', owner.id)
    .order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (shopErr) throw new Error(`barbershops: ${shopErr.message}`)
  if (!shop) {
    console.error('❌  Barbearia demo não encontrada. Rode create-demo-users.mjs primeiro.\n')
    process.exit(1)
  }
  const shopId = shop.id

  // Nome + endereço + published: sem isso a barbearia não aparece na busca
  const { error: addrErr } = await admin.from('barbershops')
    .update({ name: SHOP_NAME, ...MAIN_ADDRESS, published: true }).eq('id', shopId)
  if (addrErr) throw new Error(`endereço da barbearia: ${addrErr.message}`)
  console.log(`🏪  Barbearia: "${SHOP_NAME}" — publicada`)

  // ── 2. Equipe ─────────────────────────────────────────────────
  const barberIds = []
  for (const [i, b] of BARBERS.entries()) {
    const id = await ensureUser(users, { ...b, role: 'barber', phone: `1199999${String(20 + i).padStart(4, '0')}` })
    barberIds.push(id)
  }
  await waitForProfiles(barberIds)
  await admin.from('profiles')
    .update({ barbershop_id: shopId, active: true })
    .in('id', barberIds)

  // O dono também atende: ganha especialidade e entra na agenda como
  // barbeiro — aparece com o selo DONO na vitrine e no painel Equipe.
  await admin.from('profiles')
    .update({ specialty: 'Clássico & Navalha', active: true })
    .eq('id', owner.id)
  const workingBarbers = [owner.id, ...barberIds]
  console.log(`✂️   Equipe: ${BARBERS.length} barbeiros + o dono atendendo`)

  // ── 3. Clientes ───────────────────────────────────────────────
  const clientIds = []
  for (const [i, name] of CLIENT_NAMES.entries()) {
    const id = await ensureUser(users, {
      email: clientEmail(i), name, role: 'client',
      phone: `1198888${String(i).padStart(4, '0')}`,
    })
    clientIds.push(id)
  }
  await waitForProfiles(clientIds)
  console.log(`👥  Clientes: ${CLIENT_NAMES.length}`)

  // ── 4. Serviços (usa os preços reais cadastrados) ─────────────
  const { data: services, error: svcErr } = await admin
    .from('services').select('name, price').eq('barbershop_id', shopId).eq('active', true)
  if (svcErr) throw new Error(`services: ${svcErr.message}`)
  if (!services?.length) {
    console.error('❌  Nenhum serviço cadastrado. Rode supabase/setup_final.sql primeiro.\n')
    process.exit(1)
  }

  // ── 5. Estoque ────────────────────────────────────────────────
  // Movements primeiro: são o histórico dos produtos que vamos recriar
  await admin.from('stock_movements').delete().eq('barbershop_id', shopId)
  await admin.from('products').delete().eq('barbershop_id', shopId)
  const { data: prods, error: prodErr } = await admin.from('products')
    .insert(STOCK.map(p => ({ ...p, barbershop_id: shopId })))
    .select('id, name, cost, max_stock')
  if (prodErr) throw new Error(`products: ${prodErr.message}`)
  console.log(`📦  Estoque: ${STOCK.length} produtos`)

  // ── 5b. Livro-caixa de insumos (6 meses de compras × consumo) ──
  // Alimenta a seção "Insumos — entra × sai" e o lucro estimado dos
  // Relatórios. Compras crescem junto com o movimento da barbearia;
  // consumo fica em ~70–95% do comprado (estoque acumula um pouco).
  const seedStart = new Date(); seedStart.setHours(0, 0, 0, 0)
  seedStart.setMonth(seedStart.getMonth() - MONTHS_BACK)

  const movRows = []
  for (let m = 0; m < MONTHS_BACK; m++) {
    const mStart   = new Date(seedStart.getFullYear(), seedStart.getMonth() + m, 1)
    const mDays    = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0).getDate()
    const progress = m / (MONTHS_BACK - 1)
    const growth   = 0.55 + 0.45 * progress

    for (const p of prods) {
      // 1–2 compras no mês (reposição quinzenal quando o movimento cresce)
      const buys   = growth > 0.8 ? 2 : 1
      let boughtQty = 0
      for (let b = 0; b < buys; b++) {
        const qty = Math.max(4, Math.round(randInt(10, 22) * growth))
        boughtQty += qty
        const day = randInt(1 + b * 14, Math.min(mDays, 14 + b * 14))
        const at  = new Date(mStart.getFullYear(), mStart.getMonth(), day, randInt(9, 18), randInt(0, 59))
        movRows.push({
          barbershop_id: shopId, product_id: p.id, product_name: p.name,
          profile_id: owner.id, type: 'in', qty, unit_cost: Number(p.cost),
          created_at: at.toISOString(),
        })
      }

      // Consumo espalhado pelo mês, em baixas de 1–3 unidades
      let toConsume = Math.round(boughtQty * (0.7 + rnd() * 0.25))
      while (toConsume > 0) {
        const qty = Math.min(toConsume, randInt(1, 3))
        toConsume -= qty
        const day = randInt(1, mDays)
        const at  = new Date(mStart.getFullYear(), mStart.getMonth(), day, randInt(8, 19), randInt(0, 59))
        movRows.push({
          barbershop_id: shopId, product_id: p.id, product_name: p.name,
          profile_id: pick(workingBarbers), type: 'out', qty, unit_cost: Number(p.cost),
          created_at: at.toISOString(),
        })
      }
    }
  }
  for (let i = 0; i < movRows.length; i += 500) {
    const { error } = await admin.from('stock_movements').insert(movRows.slice(i, i + 500))
    if (error) throw new Error(`stock_movements: ${error.message}`)
  }
  const spent = movRows.filter(r => r.type === 'in').reduce((s, r) => s + r.qty * r.unit_cost, 0)
  console.log(`🧾  Livro-caixa: ${movRows.length} movimentações · R$ ${Math.round(spent).toLocaleString('pt-BR')} em compras`)

  // ── 6. Agendamentos ───────────────────────────────────────────
  await admin.from('bookings').delete().eq('barbershop_id', shopId)
  // Limpa bookings órfãos (barbershop_id nulo) de execuções antigas: o índice
  // único bookings_slot_unique é (barber_id, date, time) SEM barbershop_id,
  // então um órfão do mesmo barbeiro colidiria com os novos slots.
  await admin.from('bookings').delete().is('barbershop_id', null)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(today); start.setMonth(start.getMonth() - MONTHS_BACK)
  const totalDays = Math.round((today - start) / 86400000)

  const rows = []
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day === 0) continue // fechado aos domingos

    const isToday = iso(d) === iso(today)
    // Cresce de ~55% a 100% da capacidade ao longo dos 6 meses: o gráfico de
    // 6 meses e os deltas ficam com tendência de alta.
    const progress = Math.round((d - start) / 86400000) / totalDays
    const growth   = 0.55 + 0.45 * progress
    const busy     = day === 6 ? 1.15 : day === 1 ? 0.75 : 1 // sáb cheio, seg fraco

    const dayRows = []
    for (const barberId of workingBarbers) {
      const target = Math.min(TIME_SLOTS.length, Math.round(randInt(7, 11) * growth * busy))
      const slots  = [...TIME_SLOTS].sort(() => rnd() - 0.5).slice(0, target).sort()

      for (const time of slots) {
        const svc = weightedService(services)
        dayRows.push({
          client_id:     pick(clientIds),
          barber_id:     barberId,
          barbershop_id: shopId,
          service_name:  svc.name,
          service_price: Number(svc.price),
          date:          iso(d),
          time,
          // Passado: quase tudo concluído, alguns no-shows viram cancelados.
          status: isToday ? 'upcoming' : (rnd() < 0.04 ? 'cancelled' : 'done'),
        })
      }
    }

    // Hoje: ~70% já concluídos + 1 em curso, para o KPI "Faturamento Hoje"
    // aparecer preenchido a qualquer hora da gravação.
    if (isToday) {
      dayRows.sort((a, b) => a.time.localeCompare(b.time))
      const doneCount = Math.floor(dayRows.length * 0.7)
      dayRows.forEach((r, i) => {
        r.status = i < doneCount ? 'done' : i === doneCount ? 'current' : 'upcoming'
      })
    }

    rows.push(...dayRows)
  }

  // Insere em lotes — payload único de milhares de linhas estoura a request.
  const BATCH = 500
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await admin.from('bookings').insert(rows.slice(i, i + BATCH))
    if (error) throw new Error(`bookings (lote ${i / BATCH + 1}): ${error.message}`)
    process.stdout.write(`\r📅  Agendamentos: ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
  }

  // ── Resumo ────────────────────────────────────────────────────
  const todayRows   = rows.filter(r => r.date === iso(today))
  const doneToday   = todayRows.filter(r => r.status === 'done')
  const revToday    = doneToday.reduce((s, r) => s + r.service_price, 0)
  const capacity    = TIME_SLOTS.length * workingBarbers.length
  const occupation  = Math.round((todayRows.length / capacity) * 100)
  const revTotal    = rows.filter(r => r.status === 'done').reduce((s, r) => s + r.service_price, 0)

  console.log('\n\n' + '═'.repeat(58))
  console.log(`  ✅  SEED CONCLUÍDO — mostruário "${SHOP_NAME}"\n`)
  console.log(`  📅  Agendamentos ....... ${rows.length} (${MONTHS_BACK} meses)`)
  console.log(`  💰  Receita histórica .. R$ ${revTotal.toLocaleString('pt-BR')}`)
  console.log(`  🧾  Livro-caixa ........ ${movRows.length} movimentações de insumos`)
  console.log(`  📊  Hoje ............... ${todayRows.length} atend. · ${occupation}% ocupação`)
  console.log(`  💵  Faturamento hoje ... R$ ${revToday.toLocaleString('pt-BR')}`)
  console.log(`  🏪  Barbearia na busca . apenas "${SHOP_NAME}"\n`)
  console.log('  ▶️   Entre com admin.demo@legacybarber.com / Demo@2024')
  console.log('  ♻️   Re-rode este script antes de gravar para atualizar as datas.')
  console.log('═'.repeat(58) + '\n')
}

main().catch(err => {
  console.error('\n❌  Erro:', err.message)
  process.exit(1)
})
