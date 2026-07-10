import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconInfoCircle,
  IconTicket,
  IconX,
} from '@tabler/icons-react'
import * as api from '../api/client'
import { ESTADOS, ESTADOS_ACTIVOS, PRIORIDADES } from '../lib/constants'
import { fmtHora } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import PrioridadBadge from '../components/PrioridadBadge'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import TicketProgress from '../components/TicketProgress'
import { useNotification } from '../hooks/useNotification'
import EmptyState from '../components/EmptyState'
import { SkeletonList } from '../components/SkeletonCard'
import { useQueueSse } from '../hooks/useQueueSse'

export default function EstudiantePage() {
  const { showNotification } = useNotification()
  const [servicioId, setServicioId] = useState(null)
  const [prioridad, setPrioridad] = useState(PRIORIDADES.NORMAL)
  const [servicios, setServicios] = useState([])
  const [misTurnos, setMisTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')

  // Track called tickets to prevent duplicate notifications
  const [notificados, setNotificados] = useState(new Set())

  const cargar = useCallback(async () => {
    try {
      const [servs, turnos] = await Promise.all([api.listServicios(), api.misTurnos()])
      const activos = servs.filter((s) => s.activo)
      setServicios(activos)
      setMisTurnos(turnos)
      setError('')
      setServicioId((prev) => prev ?? (activos[0] ? String(activos[0].id) : null))
    } catch (e) {
      setError(e.message)
    }
  }, [])

  // Web Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    cargar().finally(() => setLoading(false))
  }, [cargar])

  // Escuchar actualizaciones de cola en tiempo real mediante SSE
  useQueueSse(servicioId, () => {
    // Recargar turnos del estudiante ante cualquier cambio en el servicio seleccionado
    api.misTurnos().then(setMisTurnos)
  })

  // Trigger web notification when called
  useEffect(() => {
    misTurnos.forEach((t) => {
      const isLlamado = t.estado === ESTADOS.LLAMADO || t.estado === ESTADOS.EN_ATENCION
      if (isLlamado && !notificados.has(t.id)) {
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification('¡Es tu turno!', {
            body: `Tu turno ${t.codigo} en ${t.servicioNombre} ha sido llamado.`,
          })
        }
        setNotificados((prev) => new Set([...prev, t.id]))
      }
    })
  }, [misTurnos, notificados])

  async function pedirTurno() {
    if (!servicioId) return
    setCreando(true)
    try {
      const t = await api.crearTicket({ serviceId: Number(servicioId), type: prioridad })
      showNotification({
        title: 'Turno generado',
        message: `Tu turno es ${t.codigo} en ${t.servicioNombre}`,
        color: 'teal',
        icon: <IconCheck size={18} />,
      })
      setPrioridad(PRIORIDADES.NORMAL)
      await cargar()
    } catch (e) {
      showNotification({
        title: 'No se pudo generar el turno',
        message: e.message,
        color: 'red',
      })
    } finally {
      setCreando(false)
    }
  }

  async function anular(t) {
    try {
      await api.anularTurno(t.id, 'Cancelado por el estudiante')
      showNotification({ message: `Turno ${t.codigo} anulado`, color: 'gray' })
      await cargar()
    } catch (e) {
      showNotification({ title: 'Error', message: e.message, color: 'red' })
    }
  }

  const activos = useMemo(
    () => misTurnos.filter((t) => ESTADOS_ACTIVOS.includes(t.estado)),
    [misTurnos],
  )
  
  const historial = useMemo(
    () =>
      misTurnos
        .filter((t) => !ESTADOS_ACTIVOS.includes(t.estado))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [misTurnos],
  )

  const servicioOptions = servicios.map((s) => ({
    value: String(s.id),
    label: s.nombre,
  }))

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <PageHeader
        title="Pedir un turno"
        subtitle="Solicita tu ticket de atención y sigue su estado en tiempo real."
      />

      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-800 text-sm">
          <IconAlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error de conexión:</span> {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Generación de Turno */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <Card className="shadow-sm border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <IconTicket className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800 text-base">Nuevo turno</h2>
            </div>

            <div className="flex flex-col gap-4">
              <Select
                label="Servicio / Ventanilla"
                placeholder={servicios.length ? 'Elige un servicio' : 'Sin servicios disponibles'}
                data={servicioOptions}
                value={servicioId}
                onChange={setServicioId}
                allowDeselect={false}
                disabled={servicios.length === 0}
              />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-700 tracking-wide">
                  Prioridad
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPrioridad(PRIORIDADES.NORMAL)}
                    className={`flex-1 border rounded-xl py-2 px-3 text-xs font-bold text-center tracking-wide transition-all cursor-pointer ${
                      prioridad === PRIORIDADES.NORMAL
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrioridad(PRIORIDADES.PREFERENCIAL)}
                    className={`flex-1 border rounded-xl py-2 px-3 text-xs font-bold text-center tracking-wide transition-all cursor-pointer ${
                      prioridad === PRIORIDADES.PREFERENCIAL
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Preferente
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                  * Preferente aplica a gestantes, adultos mayores, o personas con movilidad reducida.
                </p>
              </div>

              <Button
                leftSection={<IconTicket className="w-4 h-4" />}
                onClick={pedirTurno}
                loading={creando}
                disabled={!servicioId}
                className="mt-2"
              >
                Generar mi turno
              </Button>
            </div>
          </Card>
        </div>

        {/* Turnos Activos e Historial */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-lg">Mis turnos activos</h2>
            {loading && (
              <svg className="animate-spin h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </div>

          {loading && activos.length === 0 ? (
            <SkeletonList count={1} />
          ) : activos.length === 0 ? (
            <EmptyState
              icon={IconInfoCircle}
              title="No tienes turnos activos"
              description="Genera un turno a la izquierda para aparecer en la cola de atención."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {activos.map((t) => (
                <TurnoActivoCard key={t.id} turno={t} onAnular={() => anular(t)} />
              ))}
            </div>
          )}

          {/* Historial Reciente */}
          {historial.length > 0 && (
            <div className="flex flex-col gap-3 mt-2 animate-slide-in">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                Historial reciente
              </h3>
              <Card padding="none" className="overflow-hidden border-slate-200">
                <div className="divide-y divide-slate-100">
                  {historial.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-800 text-sm tracking-wide">
                          {t.codigo}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {t.servicioNombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-slate-400">
                          {fmtHora(t.finishedAt || t.createdAt)}
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
      </div>
    </div>
  )
}

function TurnoActivoCard({ turno, onAnular }) {
  const llamado = turno.estado === ESTADOS.LLAMADO || turno.estado === ESTADOS.EN_ATENCION

  return (
    <Card 
      padding="lg" 
      className={`border transition-all duration-300 relative overflow-hidden ${
        llamado 
          ? 'border-emerald-300 bg-emerald-50/20 ticket-glow-active' 
          : 'border-slate-200 shadow-sm'
      }`}
    >
      {/* Decorative left bar */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          llamado ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-2">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center bg-slate-100 text-slate-800 rounded-xl p-2.5 min-w-[76px] font-mono leading-none border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Turno</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">{turno.codigo}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h4 className="font-bold text-slate-800 text-sm">{turno.servicioNombre}</h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <EstadoBadge estado={turno.estado} size="sm" />
              <PrioridadBadge prioridad={turno.prioridad} size="sm" />
            </div>
          </div>
        </div>

        {/* Position / Notification */}
        <div className="flex flex-col items-end gap-2 self-stretch sm:self-auto shrink-0">
          {turno.estado === ESTADOS.EN_COLA && turno.posicion != null && (
            <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-xl px-3 py-1.5 text-sky-700">
              <IconClock className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-bold">
                {turno.posicion === 1 ? 'Eres el siguiente' : `${turno.posicion}º en la cola`}
              </span>
            </div>
          )}

          {llamado && (
            <div className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-xl px-3.5 py-2 animate-bounce shadow-md shadow-emerald-200">
              <svg className="w-4.5 h-4.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-xs font-black tracking-wide">
                ¡PASA A VENTANILLA!
              </span>
            </div>
          )}

          {turno.estado === ESTADOS.EN_COLA && (
            <Button
              variant="lightDanger"
              size="sm"
              leftSection={<IconX className="w-3.5 h-3.5" />}
              onClick={onAnular}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="mt-6 border-t border-slate-100 pt-4 pl-2">
        <TicketProgress estado={turno.estado} />
      </div>
    </Card>
  )
}
