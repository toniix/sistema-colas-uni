import { ROLES } from './constants'

// Ruta de inicio según el rol del usuario autenticado
export function rutaInicioPorRol(rol) {
  switch (rol) {
    case ROLES.ADMIN:
      return '/admin/dashboard'
    case ROLES.OPERADOR:
      return '/operador'
    case ROLES.ESTUDIANTE:
      return '/estudiante'
    default:
      return '/login'
  }
}
