import { useEffect, useState } from 'react'
import {
  IconAlertTriangle,
  IconClock,
  IconDownload,
  IconTicket,
  IconUserCheck,
  IconX,
  IconFileText,
} from '@tabler/icons-react'
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts'
import * as api from '../../api/client'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Dropdown, { DropdownItem } from '../../components/ui/Dropdown'
import { exportCSV, exportJSON } from '../../lib/export'
import EmptyState from '../../components/EmptyState'

export default function ReportesPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.reportes()
      .then((res) => {
        setData(res)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error && !data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Reportes y métricas" />
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-800 text-sm">
          <IconAlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error de conexión:</span> {error}
          </div>
        </div>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  const { resumen, esperaPorServicio, porOperador, porHora } = data || {}

  function exportar(formato) {
    if (!data) return
    const payload = {
      generado: new Date().toISOString(),
      resumen,
      esperaPorServicio,
      porOperador,
      porHora,
    }
    if (formato === 'json') {
      exportJSON(payload, 'reporte-colas.json')
    } else {
      // flat CSV
      exportCSV(esperaPorServicio, 'reporte-espera-por-servicio.csv')
    }
  }

  // Data for Donut Chart of status distribution
  const pieData = resumen ? [
    { name: 'Atendidos', value: resumen.atendidosHoy, color: '#10B981' }, // emerald-500
    { name: 'En cola', value: resumen.enColaAhora, color: '#0EA5E9' }, // sky-500
    { name: 'Anulados', value: resumen.anuladosHoy, color: '#F43F5E' }, // rose-500
  ].filter(d => d.value > 0) : []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes y métricas"
        subtitle="Indicadores de atención del día de hoy."
        actions={
          <Dropdown
            trigger={
              <div className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-slate-700 text-sm shadow-sm transition-all cursor-pointer">
                <IconDownload className="w-4.5 h-4.5" />
                <span>Exportar Reporte</span>
              </div>
            }
          >
            <DropdownItem onClick={() => exportar('csv')} leftSection={<IconFileText className="w-4 h-4" />}>
              Exportar CSV
            </DropdownItem>
            <DropdownItem onClick={() => exportar('json')} leftSection={<IconFileText className="w-4 h-4" />}>
              Exportar JSON
            </DropdownItem>
          </Dropdown>
        }
      />

      {/* Grid de Metricas */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-slide-in">
          <StatCard label="Turnos Hoy" value={resumen.totalHoy} icon={IconTicket} color="indigo" />
          <StatCard label="Atendidos" value={resumen.atendidosHoy} icon={IconUserCheck} color="emerald" />
          <StatCard label="En Cola Ahora" value={resumen.enColaAhora} icon={IconClock} color="sky" />
          <StatCard label="Anulados" value={resumen.anuladosHoy} icon={IconX} color="rose" />
          <StatCard label="Espera Media" value={resumen.esperaGlobal} unit="min" icon={IconClock} color="amber" />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in">
        {/* Turnos por Hora */}
        <Card padding="lg" className="border-slate-200">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-base">Distribución por Hora</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Distribución de turnos generados a lo largo del día.</p>
          </div>
          <div className="w-full h-72 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={porHora} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hora" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Bar dataKey="turnos" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Turnos" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tiempo de Espera por Servicio */}
        <Card padding="lg" className="border-slate-200">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-base">Espera por Servicio</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Tiempo promedio (minutos) desde que se crea hasta que se llama.</p>
          </div>
          {esperaPorServicio && esperaPorServicio.length === 0 ? (
            <div className="h-72 flex justify-center items-center">
              <span className="text-xs text-slate-400 font-semibold">No hay suficientes datos para graficar</span>
            </div>
          ) : (
            <div className="w-full h-72 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={esperaPorServicio} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" unit=" min" />
                  <YAxis dataKey="servicio" type="category" stroke="#94a3b8" width={90} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="espera" fill="#0EA5E9" radius={[0, 4, 4, 0]} name="Minutos" />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-slide-in">
        {/* Tabla Atendidos por Operador */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <h3 className="font-extrabold text-slate-800 text-base">Rendimiento por Operador</h3>
          <Card padding="none" className="border-slate-200 overflow-hidden shadow-sm flex-1">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-6">Nombre de Operador</th>
                    <th className="py-3 px-6 text-right">Turnos Atendidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {porOperador && porOperador.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-xs font-semibold text-slate-400">
                        Sin turnos finalizados todavía hoy
                      </td>
                    </tr>
                  ) : (
                    porOperador?.map((o) => (
                      <tr key={o.operador} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-700">{o.operador}</td>
                        <td className="py-4 px-6 text-right font-black text-indigo-600">{o.atendidos}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Estado general Donut Chart */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h3 className="font-extrabold text-slate-800 text-base">Distribución de Turnos</h3>
          <Card padding="lg" className="border-slate-200 flex flex-col justify-center items-center flex-1 min-h-[250px]">
            {pieData.length === 0 ? (
              <span className="text-xs text-slate-400 font-semibold py-12">No hay turnos registrados hoy</span>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full h-44 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                {/* Labels Legend */}
                <div className="flex gap-4 justify-center flex-wrap">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
