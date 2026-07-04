import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { rutaInicioPorRol } from '../lib/rutas'

// Protege rutas: exige sesión y, opcionalmente, uno de los roles permitidos.
export default function RequireAuth({ roles, children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (roles && !roles.includes(user.rol)) {
    // Autenticado pero sin permiso: lo mando a su inicio
    return <Navigate to={rutaInicioPorRol(user.rol)} replace />
  }
  return children
}
