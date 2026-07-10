import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { rutaInicioPorRol } from '../lib/rutas'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <h1 className="text-8xl font-black text-indigo-600 tracking-tight leading-none">
          404
        </h1>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-2">
          Página no encontrada
        </h2>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">
          La ruta que buscas no existe o no tienes los permisos adecuados para acceder.
        </p>
        <Button
          size="lg"
          onClick={() =>
            navigate(isAuthenticated ? rutaInicioPorRol(user.rol) : '/login')
          }
          className="mt-4"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}
