export type UserRole = 'admin' | 'barber' | 'client'

export interface AppUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  specialty?: string
  barbershopName?: string
  avatar: string
}

export type OpenAuthFn = (mode?: 'login' | 'register') => void
