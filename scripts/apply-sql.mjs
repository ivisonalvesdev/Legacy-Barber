/**
 * Aplica um arquivo .sql no banco do Supabase via conexão Postgres direta.
 * Atalho para não precisar colar no SQL Editor durante o desenvolvimento.
 *
 *   node --env-file=.env scripts/apply-sql.mjs supabase/setup_final.sql
 *
 * Requer DATABASE_URL no .env (Supabase Dashboard → Settings → Database →
 * Connection string → URI). O SQL Editor do Dashboard continua funcionando
 * igual — este script é só conveniência local.
 */

import { readFileSync } from 'node:fs'
import postgres from 'postgres'

const file = process.argv[2]
if (!file) {
  console.error('\n❌  Uso: node --env-file=.env scripts/apply-sql.mjs <arquivo.sql>\n')
  process.exit(1)
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('\n❌  DATABASE_URL não configurada no .env')
  console.error('   Supabase Dashboard → Settings → Database → Connection string → URI\n')
  process.exit(1)
}

const die = (msg, hint) => {
  console.error(`\n❌  ${msg}`)
  if (hint) console.error(hint)
  console.error('')
  process.exit(1)
}

// O erro do driver para uma URL de exemplo é "tenant not found" — críptico o
// bastante para parecer que o comando não rodou. Estes checks falam a verdade
// antes de tentar conectar.
const PLACEHOLDERS = ['abcdefghijk', 'SUA_SENHA_AQUI', 'YOUR-PASSWORD', '[YOUR-PASSWORD]', 'SENHA']
const found = PLACEHOLDERS.find(p => DATABASE_URL.includes(p))
if (found) {
  die(`DATABASE_URL ainda contém o texto de exemplo "${found}".`,
      '   Copie a string real: Dashboard → Settings → Database → Connection string → URI\n' +
      '   e troque [YOUR-PASSWORD] pela senha do banco.')
}

// A URL do projeto já está no .env, então o ref do DATABASE_URL tem que bater.
// Pega colar a string de OUTRO projeto Supabase sem perceber.
const expectedRef = (process.env.VITE_SUPABASE_URL ?? '').match(/^https:\/\/([a-z0-9]+)\.supabase\./)?.[1]
if (expectedRef) {
  const { username, hostname } = new URL(DATABASE_URL)
  const actualRef = username.match(/^postgres\.(.+)$/)?.[1]
                 ?? hostname.match(/^db\.(.+)\.supabase\.co$/)?.[1]
  if (actualRef && actualRef !== expectedRef) {
    die(`DATABASE_URL aponta para o projeto "${actualRef}", mas VITE_SUPABASE_URL usa "${expectedRef}".`,
        `   Pegue a connection string do projeto ${expectedRef} no Dashboard.`)
  }
}

// prepare:false — o Transaction pooler (porta 6543) não suporta prepared
// statements, e é a string que o Dashboard mostra primeiro. Sem isto, pegar a
// aba errada dá erro no meio do script.
const sql = postgres(DATABASE_URL, {
  max: 1,
  prepare: false,
  onnotice: n => console.log(`   ℹ️  ${n.message}`),
})

try {
  console.log(`\n📜  Aplicando ${file}...\n`)
  const content = readFileSync(file, 'utf8')
  const result = await sql.unsafe(content)

  // A última instrução do setup é a query de verificação
  const rows = Array.isArray(result) ? result.at(-1) : result
  if (Array.isArray(rows) && rows.length && rows[0]?.item) {
    console.log('   ┌─────────────────────────────────┬──────────────┬─────────────────')
    for (const r of rows) {
      console.log(`   │ ${String(r.item).padEnd(31)} │ ${String(r.resultado).padEnd(12)} │ ${r.esperado ?? ''}`)
    }
    console.log('   └─────────────────────────────────┴──────────────┴─────────────────')
  }
  console.log('\n✅  Aplicado com sucesso.\n')
} catch (err) {
  console.error(`\n❌  Erro: ${err.message}`)
  if (err.position) console.error(`   Posição: ${err.position}`)
  process.exitCode = 1
} finally {
  await sql.end()
}
