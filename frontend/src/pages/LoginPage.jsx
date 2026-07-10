import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconLock, IconUser, IconAlertTriangle } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { rutaInicioPorRol } from "../lib/rutas";
import Brand, { KhipuIcon } from "../components/Brand";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { TextInput, PasswordInput } from "../components/ui/Input";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(rutaInicioPorRol(user.rol), { replace: true });
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const { universityName, systemName, coverBase64 } = useBranding();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Panel Izquierdo: Branding (Oculto en móviles muy pequeños si es necesario, pero visible en general) */}
      <div
        className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-indigo-950 via-indigo-900 to-indigo-800 text-white flex-col justify-between p-12 relative overflow-hidden"
        style={
          coverBase64
            ? {
                backgroundImage: `url(${coverBase64})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      >
        {/* Dark overlay to maintain text readability when custom cover is used */}
        {coverBase64 && (
          <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-[1px] pointer-events-none" />
        )}

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

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-black text-white leading-tight mb-4 tracking-tight">
            {systemName}
          </h2>
          <p className="text-lg text-indigo-200 leading-relaxed font-medium">
            Gestión inteligente de turnos universitarios para optimizar la
            atención de estudiantes y operadores en ventanilla.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold text-indigo-300/80 tracking-widest uppercase">
          <span>{universityName}</span>
          <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
            <KhipuIcon size="xs" />
            <span className="text-[10px] font-black text-white tracking-widest uppercase">Khipu</span>
          </div>
        </div>
      </div>

      {/* Panel Derecho: Formulario de Login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="md:hidden flex justify-center">
            <Brand size="lg" />
          </div>

          <Card
            padding="xl"
            className="shadow-lg border-slate-100 animate-slide-in"
          >
            <div className="flex flex-col gap-1.5 text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Iniciar Sesión
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Introduce tus credenciales para acceder a la plataforma.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-rose-800 text-xs font-medium animate-pulse-slow">
                  <IconAlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="leading-normal">{error}</div>
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
          </Card>

          <footer className="text-center text-[10px] font-semibold text-slate-400 tracking-widest uppercase md:hidden">
            {universityName}
          </footer>
        </div>
      </div>
    </div>
  );
}
