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
  avatar:          string
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
