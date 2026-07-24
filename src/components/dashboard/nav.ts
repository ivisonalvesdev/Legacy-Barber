import type { ElementType } from 'react'
import { Calendar, Clock, User, Package, Users, LayoutDashboard, BarChart2, Store, Scissors } from 'lucide-react'
import type { UserRole } from '../../types'

export const NAV_MAP: Record<UserRole, { id: string; label: string; icon: ElementType }[]> = {
  client: [
    { id: 'agenda',       label: 'Agendar',           icon: Calendar       },
    { id: 'agendamentos', label: 'Meus Agendamentos', icon: Clock          },
    { id: 'perfil',       label: 'Perfil',            icon: User           },
  ],
  barber: [
    { id: 'agenda',  label: 'Agenda',  icon: Calendar },
    { id: 'insumos', label: 'Insumos', icon: Package  },
    { id: 'perfil',  label: 'Perfil',  icon: User     },
  ],
  admin: [
    { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { id: 'agenda',     label: 'Agenda',     icon: Calendar        },
    { id: 'barbearia',  label: 'Barbearia',  icon: Store           },
    { id: 'servicos',   label: 'Serviços',   icon: Scissors        },
    { id: 'estoque',    label: 'Estoque',    icon: Package         },
    { id: 'equipe',     label: 'Equipe',     icon: Users           },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart2       },
    { id: 'perfil',     label: 'Perfil',     icon: User            },
  ],
}
