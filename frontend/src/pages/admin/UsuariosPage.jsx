import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  IconAlertTriangle,
  IconDotsVertical,
  IconPlus,
  IconTrash,
  IconEdit,
  IconSearch,
} from '@tabler/icons-react'
import * as api from '../../api/client'
import { ROLES, ROL_LABEL } from '../../lib/constants'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Dropdown, { DropdownItem } from '../../components/ui/Dropdown'
import Modal from '../../components/ui/Modal'
import { TextInput, PasswordInput, Select } from '../../components/ui/Input'
import { useNotification } from '../../hooks/useNotification'
import EmptyState from '../../components/EmptyState'
import { SkeletonList } from '../../components/SkeletonCard'

const ROL_COLOR = { 
  ADMIN: 'violet', 
  OPERADOR: 'emerald', 
  ESTUDIANTE: 'sky' 
}

export default function UsuariosPage() {
  const { showNotification } = useNotification()
  const [usuarios, setUsuarios] = useState(null)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Modales
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [usuarioAEditar, setUsuarioAEditar] = useState(null)
  const [eliminarConfirmOpen, setEliminarConfirmOpen] = useState(false)
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const { items } = await api.listUsuarios({ size: 200 })
      setUsuarios(items)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function toggle(u) {
    try {
      await api.toggleUsuario(u.id)
      await cargar()
      showNotification({ message: `Usuario ${u.username} ${!u.enabled ? 'habilitado' : 'deshabilitado'}`, color: 'teal' })
    } catch (e) {
      showNotification({ title: 'Error', message: e.message, color: 'red' })
    }
  }

  async function handleEliminar() {
    if (!usuarioAEliminar) return
    try {
      await api.eliminarUsuario(usuarioAEliminar.id)
      showNotification({ message: `Usuario ${usuarioAEliminar.username} eliminado`, color: 'gray' })
      setEliminarConfirmOpen(false)
      setUsuarioAEliminar(null)
      await cargar()
    } catch (e) {
      showNotification({ title: 'Error', message: e.message, color: 'red' })
    }
  }

  const openEditarModal = (u) => {
    setUsuarioAEditar(u)
    setEditarOpen(true)
  }

  const openEliminarModal = (u) => {
    setUsuarioAEliminar(u)
    setEliminarConfirmOpen(true)
  }

  const filtrados = useMemo(() => {
    if (!usuarios) return []
    return usuarios.filter((u) => {
      const matchesSearch = 
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter ? u.rol === roleFilter : true

      return matchesSearch && matchesRole
    })
  }, [usuarios, searchTerm, roleFilter])

  if (error && !usuarios) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Usuarios / Cuentas" />
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
        title="Usuarios / Cuentas"
        subtitle="Cuentas del sistema y roles de acceso."
        actions={
          <Button leftSection={<IconPlus size={18} />} onClick={() => setNuevoOpen(true)}>
            Nuevo usuario
          </Button>
        }
      />

      {/* Buscador y Filtros */}
      <Card padding="md" className="border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
            <TextInput
              placeholder="Buscar por nombre, usuario, email..."
              leftSection={<IconSearch className="w-5 h-5 text-slate-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Select
              placeholder="Todos los roles"
              data={Object.values(ROLES).map((r) => ({ value: r, label: ROL_LABEL[r] }))}
              value={roleFilter}
              onChange={setRoleFilter}
              allowDeselect={true}
              className="w-full md:w-48"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filtrados.length} registro{filtrados.length === 1 ? '' : 's'}
          </span>
        </div>
      </Card>

      {usuarios === null ? (
        <SkeletonList count={3} />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={IconSearch}
          title="No se encontraron usuarios"
          description="Intenta redefinir los términos de búsqueda o filtros aplicados."
        />
      ) : (
        <Card padding="none" className="border-slate-200 overflow-hidden shadow-sm animate-slide-in">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-6">Usuario / Cuenta</th>
                  <th className="py-3 px-6">Rol</th>
                  <th className="py-3 px-6">Estado</th>
                  <th className="py-3 px-6 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtrados.map((u) => {
                  const initials = u.nombre
                    ? u.nombre
                        .split(' ')
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase()
                    : 'U'

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center border shadow-xs shrink-0 ${
                            u.rol === ROLES.ADMIN ? 'bg-violet-50 text-violet-600 border-violet-100' :
                            u.rol === ROLES.OPERADOR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-sky-50 text-sky-600 border-sky-100'
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 leading-snug">{u.nombre}</p>
                            <p className="text-xs text-slate-400 truncate font-semibold mt-0.5">
                              @{u.username} · {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge color={ROL_COLOR[u.rol]} size="sm">
                          {ROL_LABEL[u.rol] || u.rol}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => toggle(u)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            u.enabled ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              u.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Dropdown
                          trigger={
                            <div className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                              <IconDotsVertical className="w-5 h-5" />
                            </div>
                          }
                        >
                          <DropdownItem onClick={() => openEditarModal(u)} leftSection={<IconEdit className="w-4 h-4" />}>
                            Editar usuario
                          </DropdownItem>
                          <DropdownItem onClick={() => openEliminarModal(u)} color="danger" leftSection={<IconTrash className="w-4 h-4" />}>
                            Eliminar
                          </DropdownItem>
                        </Dropdown>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Nuevo Usuario */}
      <NuevoUsuarioModal opened={nuevoOpen} onClose={() => setNuevoOpen(false)} onCreated={cargar} />

      {/* Modal Editar Usuario */}
      <EditarUsuarioModal
        opened={editarOpen}
        onClose={() => {
          setEditarOpen(false)
          setUsuarioAEditar(null)
        }}
        usuario={usuarioAEditar}
        onUpdated={cargar}
      />

      {/* Modal Confirmar Eliminar */}
      <Modal opened={eliminarConfirmOpen} onClose={() => setEliminarConfirmOpen(false)} title="Eliminar usuario">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            ¿Estás seguro que deseas eliminar el usuario <b className="text-slate-800">{usuarioAEliminar?.nombre}</b> (@{usuarioAEliminar?.username})? Esta acción no se puede deshacer y revocaría sus accesos.
          </p>
          <div className="flex justify-end gap-2.5 mt-2">
            <Button variant="ghost" onClick={() => setEliminarConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" color="red" onClick={handleEliminar}>
              Eliminar usuario
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function NuevoUsuarioModal({ opened, onClose, onCreated }) {
  const { showNotification } = useNotification()
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: ROLES.ESTUDIANTE,
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  async function guardar() {
    setSaving(true)
    try {
      await api.registrarUsuario(form)
      showNotification({ message: `Usuario @${form.username} creado con éxito`, color: 'green' })
      setForm({ username: '', password: '', email: '', fullName: '', role: ROLES.ESTUDIANTE })
      onClose()
      onCreated()
    } catch (e) {
      showNotification({ title: 'No se pudo crear', message: e.message, color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  const valido = form.username && form.password && form.email && form.fullName

  return (
    <Modal opened={opened} onClose={onClose} title="Nuevo usuario" size="md">
      <div className="flex flex-col gap-4">
        <TextInput
          label="Nombre completo"
          placeholder="Ana Martínez"
          value={form.fullName}
          onChange={(e) => set('fullName')(e.target.value)}
          required
        />
        <TextInput
          label="Usuario (username)"
          placeholder="ana.martinez"
          value={form.username}
          onChange={(e) => set('username')(e.target.value)}
          required
        />
        <TextInput
          label="Correo electrónico"
          placeholder="ana@uni.edu.pe"
          type="email"
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
          required
        />
        <PasswordInput
          label="Contraseña"
          placeholder="Ingresa clave temporal"
          value={form.password}
          onChange={(e) => set('password')(e.target.value)}
          required
        />
        <Select
          label="Rol de acceso"
          data={Object.values(ROLES).map((r) => ({ value: r, label: ROL_LABEL[r] }))}
          value={form.role}
          onChange={set('role')}
          allowDeselect={false}
        />
        <div className="flex justify-end gap-2.5 mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving} disabled={!valido}>
            Crear usuario
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EditarUsuarioModal({ opened, onClose, usuario, onUpdated }) {
  const { showNotification } = useNotification()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (usuario) {
      setFullName(usuario.nombre || '')
      setEmail(usuario.email || '')
      setEnabled(usuario.enabled ?? true)
    }
  }, [usuario])

  async function guardar() {
    setSaving(true)
    try {
      await api.actualizarUsuario(usuario.id, {
        email,
        fullName,
        enabled,
      })
      showNotification({ message: `Usuario @${usuario.username} actualizado`, color: 'green' })
      onClose()
      onUpdated()
    } catch (e) {
      showNotification({ title: 'No se pudo guardar', message: e.message, color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Editar usuario" size="md">
      <div className="flex flex-col gap-4">
        <TextInput
          label="Nombre completo"
          placeholder="Ana Martínez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <TextInput
          label="Correo electrónico"
          placeholder="ana@uni.edu.pe"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-semibold text-slate-700 tracking-wide">Usuario habilitado</span>
          <button
            type="button"
            onClick={() => setEnabled((e) => !e)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="flex justify-end gap-2.5 mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving} disabled={!fullName || !email}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  )
}
