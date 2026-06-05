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
