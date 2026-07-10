import {
  IconChartBar,
  IconClipboardList,
  IconDeviceDesktop,
  IconHistory,
  IconLayoutGrid,
  IconTicket,
  IconUsers,
  IconPhoto,
} from '@tabler/icons-react'
import { ROLES } from '../lib/constants'

// Elementos de navegación por rol
export const NAV = {
  [ROLES.ESTUDIANTE]: [
    { to: '/estudiante', label: 'Pedir turno', icon: IconTicket },
    { to: '/display', label: 'Pantalla de turnos', icon: IconDeviceDesktop },
  ],
  [ROLES.OPERADOR]: [
    { to: '/operador', label: 'Atención', icon: IconClipboardList },
    { to: '/display', label: 'Pantalla de turnos', icon: IconDeviceDesktop },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: IconChartBar },
    { to: '/admin/reportes', label: 'Reportes y Métricas', icon: IconHistory },
    { to: '/admin/servicios', label: 'Servicios / Ventanillas', icon: IconLayoutGrid },
    { to: '/admin/usuarios', label: 'Usuarios / Cuentas', icon: IconUsers },
    { to: '/admin/auditoria', label: 'Bitácora Auditoría', icon: IconClipboardList },
    { to: '/admin/branding', label: 'Personalización', icon: IconPhoto },
    { to: '/display', label: 'Pantalla de turnos', icon: IconDeviceDesktop },
  ],
}
