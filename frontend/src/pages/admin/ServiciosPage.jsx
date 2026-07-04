import { useCallback, useEffect, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Menu,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconBuildingBank,
  IconDotsVertical,
  IconPlus,
  IconTrash,
  IconUserCog,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import * as api from '../../api/client'
import { ROLES } from '../../lib/constants'
import PageHeader from '../../components/PageHeader'

export default function ServiciosPage() {
  const [servicios, setServicios] = useState(null)
  const [operadores, setOperadores] = useState([])
  const [error, setError] = useState('')
  const [nuevo, nuevoH] = useDisclosure(false)

  const cargar = useCallback(async () => {
    try {
      const [servs, usuarios] = await Promise.all([
        api.listServicios(),
        api.listUsuarios({ size: 200 }),
      ])
      // Cola por servicio (para contar en espera / en atención)
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
    // cargar() hace setState de forma asíncrona (tras await), no en el cuerpo del efecto
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
    const iv = setInterval(cargar, 6000)
    return () => clearInterval(iv)
  }, [cargar])

  async function asignar(servicioId, operatorId) {
    try {
      await api.asignarOperador(servicioId, operatorId ? Number(operatorId) : undefined)
      notifications.show({ message: 'Operador actualizado', color: 'teal' })
      await cargar()
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' })
    }
  }

  function confirmarEliminar(s) {
    modals.openConfirmModal({
      title: 'Eliminar servicio',
      children: (
        <Text size="sm">
          ¿Seguro que deseas eliminar <b>{s.nombre}</b>? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await api.eliminarServicio(s.id)
          notifications.show({ message: `Servicio ${s.nombre} eliminado`, color: 'gray' })
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
        <PageHeader title="Servicios / ventanillas" />
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />} title="Error de conexión">
          {error}
        </Alert>
      </>
    )
  }

  if (!servicios) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    )
  }

  return (
    <>
      <PageHeader
        title="Servicios / ventanillas"
        subtitle="Puntos de atención, operador asignado y cola en vivo"
        actions={
          <Button leftSection={<IconPlus size={18} />} onClick={nuevoH.open}>
            Nuevo servicio
          </Button>
        }
      />

      {servicios.length === 0 ? (
        <Alert variant="light" color="gray">
          No hay servicios registrados. Crea el primero con “Nuevo servicio”.
        </Alert>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {servicios.map((s) => (
            <Card key={s.id} padding="lg">
              <Group justify="space-between" mb="md" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" color="teal" size={40} radius="md">
                    <IconBuildingBank size={22} stroke={1.6} />
                  </ThemeIcon>
                  <div>
                    <Group gap={6}>
                      <Text fw={600}>{s.nombre}</Text>
                      {!s.activo && (
                        <Badge size="xs" color="gray" variant="light">
                          inactivo
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {s.codigo}
                    </Text>
                  </div>
                </Group>
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
                      onClick={() => confirmarEliminar(s)}
                    >
                      Eliminar
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              {s.descripcion && (
                <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                  {s.descripcion}
                </Text>
              )}

              <Group grow mb="md">
                <Metric label="En cola" value={s.enCola} color="blue" />
                <Metric label="Atendiendo" value={s.current ? 1 : 0} color="teal" />
              </Group>

              <Select
                label="Operador asignado"
                placeholder="Sin asignar"
                leftSection={<IconUserCog size={16} />}
                data={operadores.map((o) => ({ value: String(o.id), label: o.nombre }))}
                value={s.operadorId ? String(s.operadorId) : null}
                onChange={(v) => asignar(s.id, v)}
                clearable
                comboboxProps={{ withinPortal: true }}
              />
            </Card>
          ))}
        </SimpleGrid>
      )}

      <NuevoServicioModal opened={nuevo} onClose={nuevoH.close} onCreated={cargar} />
    </>
  )
}

function Metric({ label, value, color }) {
  return (
    <Card padding="sm" bg="var(--mantine-color-gray-0)">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Group gap="xs" align="baseline">
        <Text fw={700} fz={24}>
          {value}
        </Text>
        <Badge variant="dot" color={color} size="sm">
          {value === 0 ? 'libre' : 'activo'}
        </Badge>
      </Group>
    </Card>
  )
}

function NuevoServicioModal({ opened, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function guardar() {
    setSaving(true)
    try {
      await api.crearServicio({ name, description, prefix: prefix.toUpperCase() })
      notifications.show({ message: `Servicio ${name} creado`, color: 'teal' })
      setName('')
      setPrefix('')
      setDescription('')
      onClose()
      onCreated()
    } catch (e) {
      notifications.show({ title: 'No se pudo crear', message: e.message, color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nuevo servicio" centered>
      <Stack gap="md">
        <TextInput
          label="Nombre"
          placeholder="Ej. Secretaría Académica"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Prefijo"
          placeholder="Ej. SEC"
          description="Prefijo del código de turno (SEC-1, SEC-2, …)"
          value={prefix}
          onChange={(e) => setPrefix(e.currentTarget.value)}
          maxLength={5}
          required
        />
        <TextInput
          label="Descripción"
          placeholder="Certificados y constancias de estudio"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving} disabled={!name || !prefix}>
            Crear servicio
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
