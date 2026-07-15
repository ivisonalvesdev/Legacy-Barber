export type UserRole = 'admin' | 'barber' | 'client'

export interface AppUser {
  id:              string
  name:            string
  email:           string
  phone:           string
  role:            UserRole
  barbershopId?:   string   // UUID da barbearia (admin e barber)
  barbershopName?: string   // Nome da barbearia (admin)
  specialty?:      string   // Especialidade (barber)
  avatar:          string   // iniciais — fallback quando não há foto
  avatarUrl?:      string   // foto no Storage
}

/** Barbearia como o cliente a vê na vitrine. */
export interface Barbershop {
  id:          string
  name:        string
  description?: string
  phone?:      string
  logoUrl?:    string
  address:     BarbershopAddress
  published:   boolean
}

export interface BarbershopAddress {
  street?:   string
  number?:   string
  district?: string
  city?:     string
  state?:    string
  zip?:      string
}

/** "Rua X, 12 · Centro · São Paulo/SP" — pula o que estiver vazio. */
export const formatAddress = (a: BarbershopAddress): string => {
  const line = [a.street, a.number].filter(Boolean).join(', ')
  const city = [a.city, a.state].filter(Boolean).join('/')
  return [line, a.district, city].filter(Boolean).join(' · ')
}

export type OpenAuthFn = (mode?: 'login' | 'register') => void

export type BookingStatus = 'upcoming' | 'current' | 'done' | 'cancelled'

export interface Service {
  id:          string
  name:        string
  durationMin: number
  price:       number
  emoji:       string
  popular:     boolean
  active:      boolean
}

export interface Product {
  id:       string
  name:     string
  category: string
  stock:    number
  maxStock: number
  unit:     string
  cost:     number
}

/** Linha do livro-caixa de insumos: compra ('in') ou consumo ('out'). */
export interface StockMovement {
  id:          string
  productId:   string | null
  productName: string
  type:        'in' | 'out'
  qty:         number
  unitCost:    number
  createdAt:   string
}
