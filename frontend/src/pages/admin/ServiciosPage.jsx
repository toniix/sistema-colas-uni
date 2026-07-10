import { useCallback, useEffect, useState } from 'react'
import {
  IconAlertTriangle,
  IconBuildingBank,
  IconDotsVertical,
  IconPlus,
  IconTrash,
  IconUserCog,
  IconEdit,
} from '@tabler/icons-react'
import * as api from '../../api/client'
import { ROLES } from '../../lib/constants'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Dropdown, { DropdownItem } from '../../components/ui/Dropdown'
import Modal from '../../components/ui/Modal'
import { TextInput, Select } from '../../components/ui/Input'
import { useNotification } from '../../hooks/useNotification'
import EmptyState from '../../components/EmptyState'
import { SkeletonCard } from '../../components/SkeletonCard'

export default function ServiciosPage() {
  const { showNotification } = useNotification()
  const [servicios, setServicios] = useState(null)
  const [operadores, setOperadores] = useState([])
  const [error, setError] = useState('')

  // Modales
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [servicioAEditar, setServicioAEditar] = useState(null)
  const [eliminarConfirmOpen, setEliminarConfirmOpen] = useState(false)
  const [servicioAEliminar, setServicioAEliminar] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const [servs, usuarios] = await Promise.all([
        api.listServicios(),
        api.listUsuarios({ size: 200 }),
      ])
      
      const conCola = await Promise.all(
        servs.map(async (s) => {
          try {
            const q = await api.colaEstado(s.id)
            return { ...s, enCola: q.queueSize, current: q.current }
          } catch {
            return { ...s, enCola: 0, current: null }
          }
        }),
      )
      setServicios(conCola)
      setOperadores(usuarios.items.filter((u) => u.rol === ROLES.OPERADOR))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    cargar()
    const iv = setInterval(cargar, 6000)
    return () => clearInterval(iv)
  }, [cargar])

  async function asignar(servicioId, operatorId) {
    try {
      await api.asignarOperador(servicioId, operatorId ? Number(operatorId) : undefined)
      showNotification({ message: 'Operador asignado con éxito', color: 'green' })
      await cargar()
    } catch (e) {
      showNotification({ title: 'Error', message: e.message, color: 'red' })
    }
  }

  async function handleEliminar() {
    if (!servicioAEliminar) return
    try {
      await api.eliminarServicio(servicioAEliminar.id)
      showNotification({ message: `Servicio ${servicioAEliminar.nombre} eliminado`, color: 'gray' })
      setEliminarConfirmOpen(false)
      setServicioAEliminar(null)
      await cargar()
    } catch (e) {
      showNotification({ title: 'Error', message: e.message, color: 'red' })
    }
  }

  const openEditarModal = (s) => {
    setServicioAEditar(s)
    setEditarOpen(true)
  }

  const openEliminarModal = (s) => {
    setServicioAEliminar(s)
    setEliminarConfirmOpen(true)
  }

  if (error && !servicios) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Servicios / ventanillas" />
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
        title="Servicios / ventanillas"
        subtitle="Puntos de atención, operador asignado y colas en vivo."
        actions={
          <Button leftSection={<IconPlus size={18} />} onClick={() => setNuevoOpen(true)}>
            Nuevo servicio
          </Button>
        }
      />

      {servicios === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : servicios.length === 0 ? (
        <EmptyState
          icon={IconBuildingBank}
          title="Sin servicios registrados"
          description="Aún no hay servicios. Haz clic en 'Nuevo servicio' para crear el primero."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in">
          {servicios.map((s) => (
            <Card key={s.id} padding="lg" className="border-slate-200 flex flex-col justify-between gap-4">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                      <IconBuildingBank className="w-5.5 h-5.5" stroke={1.8} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-800 truncate leading-snug">{s.nombre}</h3>
                      <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {s.codigo}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!s.activo && <Badge color="slate" size="sm">Inactivo</Badge>}
                    <Dropdown
                      trigger={
                        <div className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                          <IconDotsVertical className="w-5 h-5" />
                        </div>
                      }
                    >
                      <DropdownItem onClick={() => openEditarModal(s)} leftSection={<IconEdit className="w-4 h-4" />}>
                        Editar servicio
                      </DropdownItem>
                      <DropdownItem onClick={() => openEliminarModal(s)} color="danger" leftSection={<IconTrash className="w-4 h-4" />}>
                        Eliminar
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>

                {s.descripcion && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 pl-1">
                    {s.descripcion}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <span className="text-xl font-black text-indigo-600 block leading-none">{s.enCola}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">En Cola</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-center">
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
              </div>

              <div className="border-t border-slate-100 pt-4">
                <Select
                  label="Operador Asignado"
                  placeholder="Sin asignar"
                  data={operadores.map((o) => ({ value: String(o.id), label: o.nombre }))}
                  value={s.operadorId ? String(s.operadorId) : null}
                  onChange={(v) => asignar(s.id, v)}
                  allowDeselect={true}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nuevo Servicio */}
      <NuevoServicioModal opened={nuevoOpen} onClose={() => setNuevoOpen(false)} onCreated={cargar} />

      {/* Modal Editar Servicio */}
      <EditarServicioModal
        opened={editarOpen}
        onClose={() => {
          setEditarOpen(false)
          setServicioAEditar(null)
        }}
        servicio={servicioAEditar}
        onUpdated={cargar}
      />

      {/* Modal Confirmar Eliminar */}
      <Modal opened={eliminarConfirmOpen} onClose={() => setEliminarConfirmOpen(false)} title="Eliminar servicio">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            ¿Estás seguro que deseas eliminar el servicio <b className="text-slate-800">{servicioAEliminar?.nombre}</b>? Esta acción no se puede deshacer y cancelará las colas vigentes.
          </p>
          <div className="flex justify-end gap-2.5 mt-2">
            <Button variant="ghost" onClick={() => setEliminarConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" color="red" onClick={handleEliminar}>
              Eliminar servicio
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function NuevoServicioModal({ opened, onClose, onCreated }) {
  const { showNotification } = useNotification()
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function guardar() {
    setSaving(true)
    try {
      await api.crearServicio({ name, description, prefix: prefix.toUpperCase() })
      showNotification({ message: `Servicio ${name} creado con éxito`, color: 'green' })
      setName('')
      setPrefix('')
      setDescription('')
      onClose()
      onCreated()
    } catch (e) {
      showNotification({ title: 'No se pudo crear', message: e.message, color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nuevo servicio" size="md">
      <div className="flex flex-col gap-4">
        <TextInput
          label="Nombre del servicio"
          placeholder="Ej: Secretaría Académica"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextInput
          label="Prefijo de ticket"
          placeholder="Ej: SEC"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          maxLength={5}
          required
        />
        <TextInput
          label="Descripción"
          placeholder="Ej: Certificados de estudio y constancias."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex justify-end gap-2.5 mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving} disabled={!name || !prefix}>
            Crear servicio
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EditarServicioModal({ opened, onClose, servicio, onUpdated }) {
  const { showNotification } = useNotification()
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (servicio) {
      setName(servicio.nombre || '')
      setPrefix(servicio.codigo || '')
      setDescription(servicio.descripcion || '')
    }
  }, [servicio])

  async function guardar() {
    setSaving(true)
    try {
      await api.actualizarServicio(servicio.id, {
        name,
        description,
        prefix: prefix.toUpperCase(),
        assignedOperatorId: servicio.operadorId,
      })
      showNotification({ message: `Servicio ${name} actualizado`, color: 'green' })
      onClose()
      onUpdated()
    } catch (e) {
      showNotification({ title: 'No se pudo guardar', message: e.message, color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Editar servicio" size="md">
      <div className="flex flex-col gap-4">
        <TextInput
          label="Nombre del servicio"
          placeholder="Ej: Secretaría Académica"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextInput
          label="Prefijo de ticket"
          placeholder="Ej: SEC"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          maxLength={5}
          required
        />
        <TextInput
          label="Descripción"
          placeholder="Ej: Certificados de estudio y constancias."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex justify-end gap-2.5 mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving} disabled={!name || !prefix}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  )
}
