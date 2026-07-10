import { useCallback, useEffect, useState } from 'react'
import { 
  IconTicket, 
  IconUserCheck, 
  IconClock, 
  IconX, 
  IconAlertTriangle,
  IconBuildingBank,
  IconArrowRight,
  IconHistory
} from '@tabler/icons-react'
import * as api from '../../api/client'
import { ESTADOS } from '../../lib/constants'
import { fmtFechaHora } from '../../lib/format'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/EmptyState'
import { SkeletonCard, SkeletonList } from '../../components/SkeletonCard'
import SetupWizardModal from '../../components/admin/SetupWizardModal'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [servicios, setServicios] = useState([])
  const [auditorias, setAuditorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargarDatos = useCallback(async () => {
    try {
      const [reps, servs, audits] = await Promise.all([
        api.reportes(),
        api.listServicios(),
        api.listAuditoria({ size: 10, sort: 'createdAt,desc' }),
      ])
      
      setMetrics(reps.resumen)
      
      // Load queue sizes for each service
      const servsWithQueue = await Promise.all(
        servs.map(async (s) => {
          try {
            const q = await api.colaEstado(s.id)
            return { ...s, enCola: q.queueSize, current: q.current }
          } catch {
            return { ...s, enCola: 0, current: null }
          }
        })
      )
      setServicios(servsWithQueue)
      setAuditorias(audits.items || [])
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    cargarDatos().finally(() => setLoading(false))
    const iv = setInterval(cargarDatos, 5000) // Live polling
    return () => clearInterval(iv)
  }, [cargarDatos])

  const prettyAccion = (a = '') =>
    a
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())

  function colorAccion(accion = '') {
    if (accion.includes('LOGIN') || accion.includes('AUTH')) return 'sky'
    if (accion.includes('CREATE') || accion.includes('CREATED')) return 'emerald'
    if (accion.includes('CANCEL') || accion.includes('DELETE')) return 'rose'
    if (accion.includes('DERIV')) return 'violet'
    return 'slate'
  }

  if (error && !metrics) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard Principal" />
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-800 text-sm">
          <IconAlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error de conexión:</span> {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupWizardModal />
      <PageHeader 
        title="Dashboard Principal" 
        subtitle="Monitoreo de colas, atención y auditoría en tiempo real."
      />

      {loading && !metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-slide-in">
          <StatCard label="Turnos Generados" value={metrics.totalHoy} icon={IconTicket} color="indigo" />
          <StatCard label="Atendidos" value={metrics.atendidosHoy} icon={IconUserCheck} color="emerald" />
          <StatCard label="En Cola Ahora" value={metrics.enColaAhora} icon={IconClock} color="sky" />
          <StatCard label="Anulados" value={metrics.anuladosHoy} icon={IconX} color="rose" />
          <StatCard label="Espera Media" value={metrics.esperaGlobal} unit="min" icon={IconClock} color="amber" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Servicios Activos en Vivo */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-slate-800 text-base">Estado de Servicios</h2>
            {loading && (
              <svg className="animate-spin h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </div>

          {loading && servicios.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : servicios.length === 0 ? (
            <EmptyState 
              icon={IconBuildingBank}
              title="Sin servicios registrados"
              description="Crea servicios en el panel de administración para habilitar colas de atención."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servicios.map((s) => (
                <Card key={s.id} padding="md" className="border-slate-200 flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 shrink-0">
                        <IconBuildingBank className="w-5.5 h-5.5" stroke={1.8} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-800 truncate leading-snug">{s.nombre}</h3>
                        <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {s.codigo}
                        </span>
                      </div>
                    </div>
                    <Badge color={s.activo ? 'emerald' : 'slate'} size="sm">
                      {s.activo ? 'Habilitado' : 'Fuera'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                      <span className="text-xl font-black text-indigo-600 block leading-none">{s.enCola}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">En Cola</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center flex flex-col justify-center">
                      {s.current ? (
                        <>
                          <span className="font-mono font-bold text-xs text-emerald-600 truncate block leading-none">
                            {s.current.codigo}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Atendiendo</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 block leading-none">Libre</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Atendiendo</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                    <span>Operador:</span>
                    <span className="font-bold text-slate-700">{s.operadorNombre || 'Sin asignar'}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Bitácora de Auditoría Reciente */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <IconHistory className="w-5 h-5 text-slate-400" />
            <h2 className="font-extrabold text-slate-800 text-base">Acciones Recientes</h2>
          </div>

          {loading && auditorias.length === 0 ? (
            <SkeletonList count={4} />
          ) : auditorias.length === 0 ? (
            <EmptyState 
              icon={IconHistory}
              title="Sin logs de auditoría"
              description="Las acciones de login, generación de turnos y cierres aparecerán aquí."
            />
          ) : (
            <Card padding="none" className="border-slate-200 overflow-hidden shadow-sm flex-1">
              <div className="divide-y divide-slate-100">
                {auditorias.map((a) => (
                  <div key={a.id} className="p-3.5 hover:bg-slate-50/50 transition-colors flex items-start gap-3">
                    <div className="mt-1">
                      <Badge color={colorAccion(a.accion)} size="sm">
                        {prettyAccion(a.accion)}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate leading-snug">
                        {a.detalle}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-slate-400 font-bold">
                          @{a.usuario}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {fmtFechaHora(a.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
