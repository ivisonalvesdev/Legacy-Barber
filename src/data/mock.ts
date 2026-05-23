import type { AppUser } from '../types'
import { Calendar, Users, Package, BarChart2, MessageCircle, Zap } from 'lucide-react'

export const MOCK_USERS: AppUser[] = [
  { id: '1', name: 'Carlos Motta',  email: 'carlos@legacy.com', phone: '11999990001', role: 'barber', password: '123456', specialty: 'Degradê & Textura',  avatar: 'CM' },
  { id: '2', name: 'Diego Alves',   email: 'diego@legacy.com',  phone: '11999990002', role: 'barber', password: '123456', specialty: 'Barba Artística',    avatar: 'DA' },
  { id: '3', name: 'João Silva',    email: 'admin@legacy.com',  phone: '11999990003', role: 'admin',  password: '123456', barbershopName: 'Legacy Barber', avatar: 'JS' },
  { id: '4', name: 'Pedro Cliente', email: 'pedro@email.com',   phone: '11999990004', role: 'client', password: '123456', avatar: 'PC' },
]

export const SERVICES = [
  { id: 1, name: 'Corte Clássico',     duration: '30min', price: 30,  emoji: '✂️', popular: false },
  { id: 2, name: 'Barba Completa',     duration: '20min', price: 20,  emoji: '🧔', popular: false },
  { id: 3, name: 'Sobrancelha + Barba',duration: '30min', price: 40,  emoji: '⚡', popular: true  },
  { id: 4, name: 'Corte + Barba',      duration: '45min', price: 80,  emoji: '👑', popular: true  },
  { id: 5, name: 'Tratamento Capilar', duration: '60min', price: 110, emoji: '✨', popular: false },
]

export const BARBERS = [
  { id: 1, name: 'Carlos Motta',      specialty: 'Degradê & Textura', rating: 4.9, avatar: 'CM', available: true  },
  { id: 2, name: 'Diego Alves',       specialty: 'Barba Artística',   rating: 4.8, avatar: 'DA', available: true  },
  { id: 3, name: 'Vinicius Ferreira', specialty: 'Corte Clássico',    rating: 4.9, avatar: 'VF', available: false },
]

export const TIME_SLOTS = [
  '08:00','08:30','09:00','09:45','10:30','11:15',
  '13:00','13:45','14:30','15:15','16:00','17:00','18:00',
]

export const INVENTORY = [
  { id: 1, name: 'Pomada Matte',         category: 'Finalizador',  stock: 8,  max: 20,  unit: 'un', cost: 45 },
  { id: 2, name: 'Óleo de Barba',        category: 'Barba',        stock: 3,  max: 15,  unit: 'un', cost: 38 },
  { id: 3, name: 'Shampoo Profissional', category: 'Cabelo',       stock: 12, max: 24,  unit: 'un', cost: 55 },
  { id: 4, name: 'Navalha Descartável',  category: 'Instrumental', stock: 45, max: 100, unit: 'cx', cost: 12 },
  { id: 5, name: 'Cera Modeladora',      category: 'Finalizador',  stock: 2,  max: 10,  unit: 'un', cost: 42 },
  { id: 6, name: 'Condicionador',        category: 'Cabelo',       stock: 7,  max: 20,  unit: 'un', cost: 48 },
]

export const AGENDA_HOJE = [
  { time: '09:00', client: 'Bruno Carvalho', service: 'Corte + Barba',      status: 'done'     as const },
  { time: '09:45', client: 'Marcos Lima',    service: 'Corte Clássico',     status: 'done'     as const },
  { time: '10:30', client: 'Felipe Santos',  service: 'Barba Completa',     status: 'current'  as const },
  { time: '11:15', client: 'André Costa',    service: 'Corte Clássico',     status: 'upcoming' as const },
  { time: '14:00', client: 'Pedro Alves',    service: 'Tratamento Capilar', status: 'upcoming' as const },
  { time: '14:45', client: 'Rodrigo Nunes',  service: 'Corte + Barba',      status: 'upcoming' as const },
]

export const REVENUE_DATA = [
  { day: 'Seg', value: 1240 },
  { day: 'Ter', value: 1680 },
  { day: 'Qua', value: 1420 },
  { day: 'Qui', value: 2100 },
  { day: 'Sex', value: 2580 },
  { day: 'Sáb', value: 3200 },
  { day: 'Dom', value: 980  },
]

export const LANDING_FEATURES = [
  { icon: Calendar,      title: 'Agendamento Online',   desc: 'Clientes agendam 24/7 pelo celular, sem telefonema. Confirmação automática.' },
  { icon: Users,         title: 'Gestão de Equipe',     desc: 'Agenda e desempenho individual por barbeiro. Cada profissional vê sua rota.' },
  { icon: Package,       title: 'Controle de Estoque',  desc: 'Alertas quando produtos acabam. Histórico de uso e baixa rápida por item.' },
  { icon: BarChart2,     title: 'Relatórios Avançados', desc: 'Faturamento, ticket médio, ocupação — dados que viram decisões inteligentes.' },
  { icon: MessageCircle, title: 'Notificações WhatsApp',desc: 'Lembretes automáticos reduzem no-show em até 80%. Zero esforço manual.' },
  { icon: Zap,           title: 'Automação Total',      desc: 'Workflows inteligentes cuidam do operacional enquanto você foca no cliente.' },
]

export const TESTIMONIALS_DATA = [
  { name: 'Ricardo Borges', shop: 'Borges Barber · São Paulo',      avatar: 'RB', text: 'Reduzimos 80% dos no-shows com os lembretes automáticos. O sistema se pagou no primeiro mês.' },
  { name: 'André Lemos',    shop: 'Studio Lemos · Belo Horizonte',  avatar: 'AL', text: 'A visibilidade financeira é incrível. Sei exatamente quanto entrou e saiu a cada dia.' },
  { name: 'Marcos Teles',   shop: 'Teles Premium · Rio de Janeiro', avatar: 'MT', text: 'Cada barbeiro tem sua própria visão da agenda. Acabou a confusão e o retrabalho na equipe.' },
]

export const PRICING_DATA = [
  {
    name: 'Básico', price: 'Grátis', period: '',     recommended: false,
    features: ['1 barbeiro', '50 agendamentos/mês', 'Agendamento online', 'Dashboard básico'],
    cta: 'Começar Grátis',
  },
  {
    name: 'Pro',    price: 'R$ 97',  period: '/mês', recommended: true,
    features: ['Até 5 barbeiros', 'Agendamentos ilimitados', 'Notificações WhatsApp', 'Relatórios completos', 'Controle de estoque', 'Suporte prioritário'],
    cta: 'Começar Agora',
  },
  {
    name: 'Business', price: 'R$ 197', period: '/mês', recommended: false,
    features: ['Barbeiros ilimitados', 'Multi-unidades', 'API de integração', 'Gestor dedicado', 'SLA 99.9%', 'Onboarding personalizado'],
    cta: 'Falar com Vendas',
  },
]

export const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left:  `${8  + (i * 17 + 11) % 84}%`,
  top:   `${4  + (i * 23 + 7)  % 92}%`,
  size:  1.4 + (i % 4) * 0.5,
  dur:   7   + (i % 5) * 1.8,
  delay: i   * 0.38,
  amp:   14  + (i % 4) * 8,
}))
