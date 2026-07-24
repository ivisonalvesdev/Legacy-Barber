// Nota (estrelas) derivada da quantidade de likes que o barbeiro recebeu.
//
// A regra do produto: nota NÃO é 4,9 fixa para todo mundo — ela é conquistada.
// Cada corte concluído rende, no máximo, 1 like do cliente; a soma dos likes
// eleva a nota de forma gradual e com retorno decrescente (curva de saturação):
//
//   0 likes  → 4,0      15 likes → 4,5      45 likes → 4,75
//   5 likes  → 4,25    100 likes → ~4,87    ∞        → 5,0 (assíntota)
//
// Um barbeiro sem nenhum like ainda não tem nota (o app mostra "Novo").
const BASE = 4.0
const MAX  = 5.0
const K    = 15   // quanto maior, mais devagar a nota sobe

export const ratingFromLikes = (likes: number): number => {
  if (likes <= 0) return BASE
  const raw = BASE + (MAX - BASE) * (likes / (likes + K))
  return Math.round(raw * 10) / 10   // 1 casa decimal
}
