import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLock, IconUser, IconAlertTriangle } from '@tabler/icons-react'
import { useAuth } from '../auth/AuthContext'
import { useBranding } from '../context/BrandingContext'
import { rutaInicioPorRol } from '../lib/rutas'
import Brand from '../components/Brand'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { TextInput, PasswordInput } from '../components/ui/Input'

const DEMO = [
  { rol: 'Administrador', email: 'admin@unica.edu.pe', password: 'admin123', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  { rol: 'Operador', email: 'operador@unica.edu.pe', password: 'operador123', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { rol: 'Estudiante', email: 'estudiante@unica.edu.pe', password: 'estudiante123', color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(rutaInicioPorRol(user.rol), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function usarDemo(d) {
    setEmail(d.email)
    setPassword(d.password)
    setError('')
  }

  const { universityName, systemName, coverBase64 } = useBranding()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Panel Izquierdo: Branding (Oculto en móviles muy pequeños si es necesario, pero visible en general) */}
      <div 
        className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-indigo-950 via-indigo-900 to-indigo-800 text-white flex-col justify-between p-12 relative overflow-hidden"
        style={coverBase64 ? { backgroundImage: `url(${coverBase64})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {/* Dark overlay to maintain text readability when custom cover is used */}
        {coverBase64 && <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-[1px] pointer-events-none" />}

        {/* Background glow graphics */}
        {!coverBase64 && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none translate-x-20 -translate-y-20" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -translate-x-20 translate-y-20" />
          </>
        )}

        <div className="relative z-10">
          <Brand size="lg" dark />
        </div>

        <div className="relative z-10 flex flex-col gap-4 max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            {systemName}
          </h2>
          <p className="text-lg text-indigo-200 leading-relaxed font-medium">
            Gestión inteligente de turnos universitarios para optimizar la atención de estudiantes y operadores en ventanilla.
          </p>
        </div>

        <div className="relative z-10 text-xs font-semibold text-indigo-300 tracking-wider uppercase">
          {universityName}
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Logo visible en mobile */}
          <div className="flex justify-center md:hidden mb-2">
            <Brand size="lg" />
          </div>

          <Card padding="xl" className="shadow-lg border-slate-100 animate-slide-in">
            <div className="flex flex-col gap-1.5 text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Iniciar Sesión
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-800 text-xs leading-relaxed">
                  <IconAlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error de ingreso:</span> {error}
                  </div>
                </div>
              )}

              <TextInput
                label="Correo Electrónico"
                placeholder="correo@unica.edu.pe"
                type="email"
                leftSection={<IconUser className="w-5 h-5 text-slate-400" />}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
                autoComplete="email"
              />

              <PasswordInput
                label="Contraseña"
                placeholder="Ingresa tu contraseña"
                leftSection={<IconLock className="w-5 h-5 text-slate-400" />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                className="mt-2"
              >
                Entrar al Sistema
              </Button>
            </form>

            {/* Separador */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 font-semibold text-slate-400 uppercase tracking-wider">
                  Cuentas de demostración
                </span>
              </div>
            </div>

            {/* Cuentas Demo */}
            <div className="flex flex-col gap-2.5">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => usarDemo(d)}
                  className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer ${d.color}`}
                >
                  <span className="font-bold">{d.rol}</span>
                  <span className="opacity-75 font-mono">
                    {d.email} · {d.password}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <footer className="text-center text-[10px] font-semibold text-slate-400 tracking-widest uppercase md:hidden">
            {universityName}
          </footer>
        </div>
      </div>
    </div>
  )
}
