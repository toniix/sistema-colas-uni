import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import RequireAuth from './auth/RequireAuth'
import { rutaInicioPorRol } from './lib/rutas'
import { ROLES } from './lib/constants'
import AppLayout from './layout/AppLayout'
import LoginPage from './pages/LoginPage'
import EstudiantePage from './pages/EstudiantePage'
import OperadorPage from './pages/OperadorPage'
import PantallaPage from './pages/PantallaPage'
import ReportesPage from './pages/admin/ReportesPage'
import ServiciosPage from './pages/admin/ServiciosPage'
import UsuariosPage from './pages/admin/UsuariosPage'
import AuditoriaPage from './pages/admin/AuditoriaPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={rutaInicioPorRol(user.rol)} replace /> : <LoginPage />
        }
      />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route
          path="/estudiante"
          element={
            <RequireAuth roles={[ROLES.ESTUDIANTE]}>
              <EstudiantePage />
            </RequireAuth>
          }
        />
        <Route
          path="/operador"
          element={
            <RequireAuth roles={[ROLES.OPERADOR]}>
              <OperadorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <RequireAuth roles={[ROLES.ADMIN]}>
              <ReportesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/servicios"
          element={
            <RequireAuth roles={[ROLES.ADMIN]}>
              <ServiciosPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RequireAuth roles={[ROLES.ADMIN]}>
              <UsuariosPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/auditoria"
          element={
            <RequireAuth roles={[ROLES.ADMIN]}>
              <AuditoriaPage />
            </RequireAuth>
          }
        />
        {/* Pantalla pública disponible para cualquier usuario autenticado */}
        <Route path="/pantalla" element={<PantallaPage />} />
      </Route>

      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? rutaInicioPorRol(user.rol) : '/login'} replace />
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
