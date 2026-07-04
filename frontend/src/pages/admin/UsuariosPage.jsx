import { useCallback, useEffect, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Menu,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconDotsVertical,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import * as api from '../../api/client'
import { ROLES, ROL_LABEL } from '../../lib/constants'
import PageHeader from '../../components/PageHeader'

const ROL_COLOR = { ADMIN: 'grape', OPERADOR: 'teal', ESTUDIANTE: 'blue' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState(null)
  const [error, setError] = useState('')
  const [nuevo, nuevoH] = useDisclosure(false)

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
    // cargar() hace setState de forma asíncrona (tras await), no en el cuerpo del efecto
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
  }, [cargar])

  async function toggle(u) {
    try {
      await api.toggleUsuario(u.id)
      await cargar()
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' })
    }
  }

  function confirmarEliminar(u) {
    modals.openConfirmModal({
      title: 'Eliminar usuario',
      children: (
        <Text size="sm">
          ¿Eliminar a <b>{u.nombre}</b> ({u.username})? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await api.eliminarUsuario(u.id)
          notifications.show({ message: `Usuario ${u.username} eliminado`, color: 'gray' })
          await cargar()
        } catch (e) {
          notifications.show({ title: 'Error', message: e.message, color: 'red' })
        }
      },
    })
  }

  if (error) {
    return (
      <>
        <PageHeader title="Usuarios" />
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />} title="Error de conexión">
          {error}
        </Alert>
      </>
    )
  }

  if (!usuarios) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    )
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Cuentas del sistema y sus roles"
        actions={
          <Button leftSection={<IconPlus size={18} />} onClick={nuevoH.open}>
            Nuevo usuario
          </Button>
        }
      />
      <Card padding={0}>
        <Table.ScrollContainer minWidth={640}>
          <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th>Habilitado</Table.Th>
                <Table.Th w={60}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {usuarios.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Avatar color={ROL_COLOR[u.rol]} radius="xl" size={36}>
                        {u.nombre
                          ?.split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')}
                      </Avatar>
                      <div>
                        <Text fw={600} size="sm">
                          {u.nombre}
                        </Text>
                        <Text size="xs" c="dimmed">
                          @{u.username} · {u.email}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={ROL_COLOR[u.rol]}>
                      {ROL_LABEL[u.rol] || u.rol}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Switch
                      checked={!!u.enabled}
                      onChange={() => toggle(u)}
                      color="teal"
                      size="sm"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Menu position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={18} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => confirmarEliminar(u)}
                        >
                          Eliminar
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <NuevoUsuarioModal opened={nuevo} onClose={nuevoH.close} onCreated={cargar} />
    </>
  )
}

function NuevoUsuarioModal({ opened, onClose, onCreated }) {
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
      notifications.show({ message: `Usuario ${form.username} creado`, color: 'teal' })
      setForm({ username: '', password: '', email: '', fullName: '', role: ROLES.ESTUDIANTE })
      onClose()
      onCreated()
    } catch (e) {
      notifications.show({ title: 'No se pudo crear', message: e.message, color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  const valido = form.username && form.password && form.email && form.fullName

  return (
    <Modal opened={opened} onClose={onClose} title="Nuevo usuario" centered>
      <Stack gap="md">
        <TextInput
          label="Nombre completo"
          placeholder="Ana Martínez"
          value={form.fullName}
          onChange={(e) => set('fullName')(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Usuario"
          placeholder="ana.martinez"
          value={form.username}
          onChange={(e) => set('username')(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Correo"
          placeholder="ana@uni.edu.pe"
          type="email"
          value={form.email}
          onChange={(e) => set('email')(e.currentTarget.value)}
          required
        />
        <PasswordInput
          label="Contraseña"
          value={form.password}
          onChange={(e) => set('password')(e.currentTarget.value)}
          required
        />
        <Select
          label="Rol"
          data={Object.values(ROLES).map((r) => ({ value: r, label: ROL_LABEL[r] }))}
          value={form.role}
          onChange={set('role')}
          allowDeselect={false}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving} disabled={!valido}>
            Crear usuario
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
