import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconAlertTriangle, IconArrowRight, IconSearch } from '@tabler/icons-react'
import * as api from '../../api/client'
import { fmtFechaHora } from '../../lib/format'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { TextInput, Select } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useNotification } from '../../hooks/useNotification'
import EmptyState from '../../components/EmptyState'

function colorAccion(accion = '') {
  if (accion.includes('LOGIN') || accion.includes('AUTH')) return 'sky'
  if (accion.includes('CREATE') || accion.includes('CREATED')) return 'emerald'
  if (accion.includes('CANCEL') || accion.includes('DELETE')) return 'rose'
  if (accion.includes('DERIV')) return 'violet'
  if (accion.includes('STATUS') || accion.includes('CHANGED')) return 'amber'
  return 'slate'
}

const prettyAccion = (a = '') =>
  a
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

export default function AuditoriaPage() {
  const { showNotification } = useNotification()
  const [registros, setRegistros] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtros
  const [q, setQ] = useState('')
  const [accion, setAccion] = useState('')
  const [accionesUnicas, setAccionesUnicas] = useState([])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch audit log with server pagination
      const data = await api.listAuditoria({ page, size: pageSize, sort: 'createdAt,desc' })
      setRegistros(data.items || [])
      setTotalElements(data.total || 0)
      setTotalPages(data.totalPages || 0)
      setError('')

      // Dynamically extract actions list from page items (or general historic list)
      if (accionesUnicas.length === 0 && data.items) {
        const unique = [...new Set(data.items.map((r) => r.accion))].filter(Boolean)
        setAccionesUnicas(unique)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, accionesUnicas.length])

  useEffect(() => {
    cargar()
    const iv = setInterval(cargar, 8000)
    return () => clearInterval(iv)
  }, [cargar])

  // Filter logs locally based on search terms if the backend is not fully searchable
  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      if (accion && r.accion !== accion) return false
      if (q) {
        const t = `${r.usuario} ${r.detalle} ${r.entidad}`.toLowerCase()
        if (!t.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [registros, q, accion])

  function exportarAuditoria() {
    try {
      const headers = ['Fecha/Hora', 'Usuario', 'Rol', 'Acción', 'Detalle', 'Entidad', 'Valor Anterior', 'Valor Nuevo']
      const rows = registros.map((r) => [
        fmtFechaHora(r.timestamp),
        r.usuario,
        r.usuarioRol || '—',
        r.accion,
        r.detalle || '',
        r.entidad ? `${r.entidad} #${r.entidadId || ''}` : '',
        r.valorAnterior || '',
        r.valorNuevo || '',
      ])

      const csvContent = 
        'data:text/csv;charset=utf-8,\uFEFF' + 
        [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `auditoria_colas_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showNotification({ message: 'Bitácora exportada con éxito', color: 'green' })
    } catch (e) {
      showNotification({ title: 'Error al exportar', message: e.message, color: 'red' })
    }
  }

  if (error && registros.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Auditoría" />
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
      <PageHeader
        title="Auditoría"
        subtitle="Registro de acciones del sistema (turnos, usuarios, sesiones)."
        actions={
          <Button variant="outline" onClick={exportarAuditoria}>
            Exportar CSV
          </Button>
        }
      />

      {/* Buscadores */}
      <Card padding="md" className="border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
            <TextInput
              placeholder="Buscar usuario, detalle o entidad..."
              leftSection={<IconSearch className="w-5 h-5 text-slate-400" />}
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              className="max-w-md"
            />
            <Select
              placeholder="Todas las acciones"
              data={accionesUnicas.map((a) => ({ value: a, label: prettyAccion(a) }))}
              value={accion}
              onChange={(v) => setAccion(v || '')}
              allowDeselect={true}
              className="w-full md:w-56"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filtrados.length} registros cargados
          </span>
        </div>
      </Card>

      {loading && registros.length === 0 ? (
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-8 flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={IconSearch}
          title="Sin registros de auditoría"
          description="Intente modificar sus criterios de búsqueda."
        />
      ) : (
        <div className="flex flex-col gap-4 animate-slide-in">
          <Card padding="none" className="border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-6">Fecha / hora</th>
                    <th className="py-3 px-6">Usuario</th>
                    <th className="py-3 px-6">Acción</th>
                    <th className="py-3 px-6">Detalle</th>
                    <th className="py-3 px-6">Cambio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtrados.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-slate-400 font-semibold whitespace-nowrap">
                        {fmtFechaHora(r.timestamp)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <p className="font-bold text-slate-800">@{r.usuario}</p>
                        {r.usuarioRol && (
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {r.usuarioRol}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <Badge color={colorAccion(r.accion)} size="sm">
                          {prettyAccion(r.accion)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 max-w-xs md:max-w-sm">
                        <p className="font-semibold text-slate-700 leading-relaxed mb-0.5">{r.detalle || '—'}</p>
                        {r.entidad && (
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            {r.entidad} {r.entidadId ? `#${r.entidadId}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {r.valorAnterior || r.valorNuevo ? (
                          <div className="flex items-center gap-2 text-slate-400 font-mono">
                            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                              {r.valorAnterior || '—'}
                            </span>
                            <IconArrowRight className="w-3.5 h-3.5" />
                            <span className="bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                              {r.valorNuevo || '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-400">
                Página <b className="text-slate-700">{page + 1}</b> de <b className="text-slate-700">{totalPages}</b> · {totalElements} registros totales
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
