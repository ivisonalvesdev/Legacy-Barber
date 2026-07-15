import type { Service } from '../types'

// Grade de horários oferecida pelas barbearias.
// (Próximo passo natural: tornar configurável por barbearia no banco.)
export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:45', '10:30', '11:15',
  '13:00', '13:45', '14:30', '15:15', '16:00', '17:00', '18:00',
]

// Fallback usado apenas se a tabela `services` ainda não existir no banco
// (antes de rodar supabase/setup_final.sql). Espelha o seed padrão do SQL.
export const DEFAULT_SERVICES: Service[] = [
  { id: 'default-1', name: 'Corte Clássico',      durationMin: 30, price: 30,  emoji: '✂️', popular: false, active: true },
  { id: 'default-2', name: 'Barba Completa',      durationMin: 20, price: 20,  emoji: '🧔', popular: false, active: true },
  { id: 'default-3', name: 'Sobrancelha + Barba', durationMin: 30, price: 40,  emoji: '⚡', popular: true,  active: true },
  { id: 'default-4', name: 'Corte + Barba',       durationMin: 45, price: 80,  emoji: '👑', popular: true,  active: true },
  { id: 'default-5', name: 'Tratamento Capilar',  durationMin: 60, price: 110, emoji: '✨', popular: false, active: true },
]

export const PRODUCT_CATEGORIES = ['Finalizador', 'Barba', 'Cabelo', 'Instrumental']
