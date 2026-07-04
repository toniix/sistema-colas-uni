import {
  IconChartBar,
  IconClipboardList,
  IconDeviceDesktop,
  IconHistory,
  IconLayoutGrid,
  IconTicket,
  IconUsers,
} from '@tabler/icons-react'
import { ROLES } from '../lib/constants'

// Elementos de navegación por rol
export const NAV = {
  [ROLES.ESTUDIANTE]: [
    { to: '/estudiante', label: 'Pedir turno', icon: IconTicket },
    { to: '/pantalla', label: 'Pantalla de turnos', icon: IconDeviceDesktop },
  ],
  [ROLES.OPERADOR]: [
    { to: '/operador', label: 'Atención', icon: IconClipboardList },
    { to: '/pantalla', label: 'Pantalla de turnos', icon: IconDeviceDesktop },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin/reportes', label: 'Reportes', icon: IconChartBar },
    { to: '/admin/servicios', label: 'Servicios', icon: IconLayoutGrid },
    { to: '/admin/usuarios', label: 'Usuarios', icon: IconUsers },
    { to: '/admin/auditoria', label: 'Auditoría', icon: IconHistory },
    { to: '/pantalla', label: 'Pantalla de turnos', icon: IconDeviceDesktop },
  ],
}
