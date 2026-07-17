import { Calendar, Users, Package, BarChart2, MessageCircle, Zap } from 'lucide-react'

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
    name: 'Pro',    price: 'R$ 29,90',  period: '/mês', recommended: true,
    features: ['Até 5 barbeiros', 'Agendamentos ilimitados', 'Notificações WhatsApp', 'Relatórios completos', 'Controle de estoque', 'Suporte prioritário'],
    cta: 'Começar Agora',
  },
  {
    name: 'Business', price: 'R$ 49,90', period: '/mês', recommended: false,
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
