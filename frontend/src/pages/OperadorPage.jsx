import { useCallback, useEffect, useState } from 'react'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBellRinging,
  IconCheck,
  IconClock,
  IconPlayerPlay,
  IconUsers,
} from '@tabler/icons-react'
import * as api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ESTADOS } from '../lib/constants'
import { fmtHora } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import PrioridadBadge from '../components/PrioridadBadge'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Select, Textarea } from '../components/ui/Input'
import LiveTimer from '../components/LiveTimer'
import { useNotification } from '../hooks/useNotification'
import EmptyState from '../components/EmptyState'

export default function OperadorPage() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [servicios, setServicios] = useState([])
  const [miServicio, setMiServicio] = useState(null)
  const [queue, setQueue] = useState({ queueSize: 0, estimatedWaitMinutes: 0, current: null })
  const [activo, setActivo] = useState(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  // Session history (processed tickets)
  const [historialSesion, setHistorialSesion] = useState([])

  // Modal States
  const [cancelOpen, setCancelOpen] = useState(false)
  const [derivOpen, setDerivOpen] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [destino, setDestino] = useState('')

  // Identifica el servicio asignado al operador autenticado.
  const cargarServicios = useCallback(async () => {
    const servs = await api.listServicios()
    setServicios(servs)
    const mio = servs.find((s) => s.operadorId === user.id) || null
    setMiServicio(mio)
    return mio
  }, [user.id])

  const refrescarCola = useCallback(
    async (servicio) => {
      const s = servicio || miServicio
      if (!s) return
      const q = await api.colaEstado(s.id)
      setQueue(q)
      // Recupera el turno en curso al recargar la página (si es mío y sigue activo)
      setActivo((prev) => {
        if (prev) return prev
        const c = q.current
        if (c && c.operadorId === user.id && (c.estado === ESTADOS.LLAMADO || c.estado === ESTADOS.EN_ATENCION)) {
          return c
        }
        return prev
      })
    },
    [miServicio, user.id],
  )

  useEffect(() => {
    let iv
    ;(async () => {
      try {
        const mio = await cargarServicios()
        await refrescarCola(mio)
        setError('')
        iv = setInterval(() => refrescarCola(mio).catch(() => {}), 4000)
      } catch (e) {
        setError(e.message)
      } finally {
        setReady(true)
      }
    })()
    return () => clearInterval(iv)
  }, [cargarServicios, refrescarCola])

  async function accion(fn, okMsg, onCompletado) {
    setBusy(true)
    try {
      const res = await fn()
      if (okMsg) showNotification({ ...okMsg })
      if (onCompletado && res) onCompletado(res)
      await refrescarCola()
    } catch (e) {
      showNotification({ title: 'No se pudo completar', message: e.message, color: 'red' })
    } finally {
      setBusy(false)
    }
  }

  const llamarSiguiente = () =>
    accion(
      async () => await api.llamarSiguiente(),
      null,
      (t) => {
        setActivo(t)
        showNotification({
          title: 'Turno llamado',
          message: `${t.codigo} · ${t.estudiante}`,
          color: 'teal',
          icon: <IconBellRinging size={18} />,
        })
      }
    )

  const iniciar = () =>
    accion(
      async () => await api.iniciarAtencion(activo.id),
      null,
      (t) => setActivo(t)
    )

  const finalizar = () =>
    accion(
      async () => {
        await api.finalizarTurno(activo.id)
        return activo
      },
      null,
      (t) => {
        setActivo(null)
        setHistorialSesion((prev) => [
          { ...t, estado: ESTADOS.FINALIZADO, finishedAt: new Date().toISOString() },
          ...prev.slice(0, 4),
        ])
        showNotification({
          message: `Turno ${t.codigo} finalizado`,
          color: 'teal',
          icon: <IconCheck size={18} />,
        })
      }
    )

  const anular = () =>
    accion(
      async () => {
        await api.anularTurno(activo.id, observacion || 'Anulado por el operador')
        return activo
      },
      null,
      (t) => {
        setActivo(null)
        setObservacion('')
        setCancelOpen(false)
        setHistorialSesion((prev) => [
          { ...t, estado: ESTADOS.ANULADO, finishedAt: new Date().toISOString() },
          ...prev.slice(0, 4),
        ])
        showNotification({ message: `Turno ${t.codigo} anulado`, color: 'gray' })
      }
    )

  const derivar = () =>
    accion(
      async () => {
        const original = await api.derivarTurno(activo.id, {
          targetServiceId: Number(destino),
          reason: observacion || 'Derivación entre servicios',
        })
        return original
      },
      null,
      (original) => {
        setActivo(null)
        setObservacion('')
        setDestino('')
        setDerivOpen(false)
        setHistorialSesion((prev) => [
          { ...original, estado: ESTADOS.DERIVADO, finishedAt: new Date().toISOString() },
          ...prev.slice(0, 4),
        ])
        showNotification({
          title: 'Turno derivado',
          message: `${original.codigo} → ${original.derivadoA || 'otro servicio'}`,
          color: 'grape',
          icon: <IconArrowRight size={18} />,
        })
      }
    )

  if (error) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <PageHeader title="Panel de atención" />
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-800 text-sm">
          <IconAlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error de conexión:</span> {error}
          </div>
        </div>
      </div>
    )
  }

  if (ready && !miServicio) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <PageHeader title="Panel de atención" subtitle={user.nombre} />
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-800 text-sm">
          <IconAlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Sin servicio asignado:</span> Aún no tienes una ventanilla o servicio asignado. Pídele a un administrador que te asigne uno para poder atender turnos.
          </div>
        </div>
      </div>
    )
  }

  const enAtencion = activo?.estado === ESTADOS.EN_ATENCION
  const llamado = activo?.estado === ESTADOS.LLAMADO

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <PageHeader
        title="Panel de atención"
        subtitle={`${user.nombre} ${miServicio ? `· Ventanilla ${miServicio.nombre} (${miServicio.codigo})` : ''}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel de atención en curso */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card padding="xl" className="shadow-sm border-slate-200 min-h-[300px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-base">Atención en curso</h3>
                {activo && <EstadoBadge estado={activo.estado} />}
              </div>

              {!activo ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl shadow-sm border border-slate-100 mb-4 animate-pulse">
                    <IconUsers className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No hay turnos activos</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed mt-1 mb-6">
                    Llama al siguiente estudiante de la cola del servicio para comenzar la atención.
                  </p>
                  <Button
                    size="lg"
                    leftSection={<IconBellRinging className="w-4.5 h-4.5" />}
                    onClick={llamarSiguiente}
                    loading={busy}
                    disabled={queue.queueSize === 0}
                  >
                    Llamar siguiente turno
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-slide-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-5">
                      <div className="flex flex-col items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl p-4 min-w-[100px] font-mono leading-none ticket-glow">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Turno</span>
                        <span className="text-4xl font-black">{activo.codigo}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">
                          {activo.estudiante}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <PrioridadBadge prioridad={activo.prioridad} />
                          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {activo.servicioNombre}
                          </span>
                        </div>
                        {activo.derivadoA && (
                          <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 w-fit">
                            Derivado de: {activo.derivadoA}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                      <span className="text-xs text-slate-400 font-semibold">
                        Llamado: {fmtHora(activo.calledAt)}
                      </span>
                      {enAtencion && activo.startedAt && (
                        <div className="text-xs bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                          <IconClock className="w-3.5 h-3.5" />
                          <span>Atendiendo hace</span>
                          <LiveTimer desde={activo.startedAt} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {activo && (
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100 mt-6">
                {llamado && (
                  <Button
                    leftSection={<IconPlayerPlay className="w-4 h-4" />}
                    onClick={iniciar}
                    loading={busy}
                    variant="primary"
                  >
                    Iniciar atención
                  </Button>
                )}
                {enAtencion && (
                  <>
                    <Button
                      variant="success"
                      leftSection={<IconCheck className="w-4 h-4" />}
                      onClick={finalizar}
                      loading={busy}
                    >
                      Finalizar atención
                    </Button>
                    <Button
                      variant="lightPurple"
                      leftSection={<IconArrowRight className="w-4 h-4" />}
                      onClick={() => setDerivOpen(true)}
                    >
                      Derivar turno
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 ml-auto"
                  onClick={() => setCancelOpen(true)}
                >
                  Anular turno
                </Button>
              </div>
            )}
          </Card>

          {/* Historial de la sesión */}
          {historialSesion.length > 0 && (
            <div className="flex flex-col gap-3 animate-slide-in">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                Historial de la sesión (Últimos 5)
              </h3>
              <Card padding="none" className="overflow-hidden border-slate-200 shadow-xs">
                <div className="divide-y divide-slate-100">
                  {historialSesion.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-700">{t.codigo}</span>
                        <span className="text-xs text-slate-500 font-semibold">{t.estudiante}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {fmtHora(t.finishedAt)}
                        </span>
                        <EstadoBadge estado={t.estado} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Estado de la cola */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card padding="lg" className="shadow-sm border-slate-200">
            <h3 className="font-bold text-slate-800 text-base mb-6">Estado de la cola</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-3xl font-black text-indigo-600">{queue.queueSize}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">En espera</span>
              </div>
              <div className="flex flex-col items-center bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-black text-slate-800">{queue.estimatedWaitMinutes}</span>
                  <span className="text-xs font-semibold text-slate-400">min</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Espera est.</span>
              </div>
            </div>

            {queue.current ? (
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-slate-400">
                  <IconClock className="w-4.5 h-4.5" />
                  <span className="text-xs font-semibold text-slate-500">Atendiendo ahora</span>
                </div>
                <span className="font-mono font-bold text-slate-800 text-sm tracking-wide bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {queue.current.codigo}
                </span>
              </div>
            ) : (
              <div className="text-center py-4 text-xs font-semibold text-slate-400 border border-dashed border-slate-200 rounded-xl mb-6">
                Nadie en atención en este momento
              </div>
            )}

            <Button
              fullWidth
              variant="secondary"
              leftSection={<IconBellRinging className="w-4 h-4" />}
              onClick={llamarSiguiente}
              loading={busy}
              disabled={queue.queueSize === 0 || !!activo}
            >
              Llamar siguiente
            </Button>
            {activo && (
              <p className="text-[10px] text-slate-400 font-semibold text-center mt-2.5">
                * Concluye la atención en curso antes de llamar a otro.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Anular */}
      <Modal opened={cancelOpen} onClose={() => setCancelOpen(false)} title="Anular turno" size="md">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 font-medium">
            Estás a punto de anular el turno <b className="text-slate-800">{activo?.codigo}</b> de <b className="text-slate-800">{activo?.estudiante}</b>.
          </p>
          <Textarea
            label="Motivo de la anulación"
            placeholder="Ej: El estudiante no se presentó tras ser llamado reiteradamente."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            minRows={3}
            required
          />
          <div className="flex justify-end gap-2.5 mt-2">
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Cancelar
            </Button>
            <Button color="red" variant="danger" onClick={anular} loading={busy} disabled={!observacion.trim()}>
              Anular Turno
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Derivar */}
      <Modal opened={derivOpen} onClose={() => setDerivOpen(false)} title="Derivar a otro servicio" size="md">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 font-medium">
            Estás a punto de derivar el turno <b className="text-slate-800">{activo?.codigo}</b>. Se creará un nuevo ticket en la cola del servicio destino.
          </p>
          <Select
            label="Servicio de destino"
            placeholder="Selecciona un servicio"
            data={servicios
              .filter((s) => s.id !== miServicio?.id && s.activo)
              .map((s) => ({ value: String(s.id), label: s.nombre }))}
            value={destino}
            onChange={setDestino}
            required
          />
          <Textarea
            label="Motivo de la derivación"
            placeholder="Ej: Requiere regularizar un pago en ventanilla de tesorería primero."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            minRows={2.5}
            required
          />
          <div className="flex justify-end gap-2.5 mt-2">
            <Button variant="ghost" onClick={() => setDerivOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={derivar}
              loading={busy}
              disabled={!destino || !observacion.trim()}
              leftSection={<IconArrowRight className="w-4 h-4" />}
            >
              Derivar Turno
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
