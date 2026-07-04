import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Radio,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconClockHour4,
  IconInfoCircle,
  IconTicket,
  IconX,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import * as api from '../api/client'
import { ESTADOS, ESTADOS_ACTIVOS, PRIORIDADES } from '../lib/constants'
import { fmtHora } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import PrioridadBadge from '../components/PrioridadBadge'
import PageHeader from '../components/PageHeader'

export default function EstudiantePage() {
  const [servicioId, setServicioId] = useState(null)
  const [prioridad, setPrioridad] = useState(PRIORIDADES.NORMAL)
  const [servicios, setServicios] = useState([])
  const [misTurnos, setMisTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      const [servs, turnos] = await Promise.all([api.listServicios(), api.misTurnos()])
      setServicios(servs.filter((s) => s.activo))
      setMisTurnos(turnos)
      setError('')
      setServicioId((prev) => prev ?? (servs[0] ? String(servs[0].id) : null))
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar().finally(() => setLoading(false))
    const iv = setInterval(cargar, 5000) // refresco de estado en vivo
    return () => clearInterval(iv)
  }, [cargar])

  async function pedirTurno() {
    if (!servicioId) return
    setCreando(true)
    try {
      const t = await api.crearTicket({ serviceId: Number(servicioId), type: prioridad })
      notifications.show({
        title: 'Turno generado',
        message: `Tu turno es ${t.codigo} en ${t.servicioNombre}`,
        color: 'teal',
        icon: <IconCheck size={18} />,
      })
      setPrioridad(PRIORIDADES.NORMAL)
      await cargar()
    } catch (e) {
      notifications.show({
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
      notifications.show({ message: `Turno ${t.codigo} anulado`, color: 'gray' })
      await cargar()
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' })
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
        .slice(0, 6),
    [misTurnos],
  )

  const servicioOptions = servicios.map((s) => ({
    value: String(s.id),
    label: s.nombre,
  }))

  return (
    <>
      <PageHeader
        title="Pedir un turno"
        subtitle="Solicita tu turno y sigue su estado en tiempo real."
      />

      {error && (
        <Alert
          variant="light"
          color="red"
          icon={<IconAlertTriangle size={18} />}
          mb="lg"
          title="No se pudo conectar con el servidor"
        >
          {error}
        </Alert>
      )}

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card padding="lg">
            <Group gap="xs" mb="md">
              <ThemeIcon variant="light" color="teal" radius="md">
                <IconTicket size={18} />
              </ThemeIcon>
              <Title order={4}>Nuevo turno</Title>
            </Group>

            <Stack gap="md">
              <Select
                label="Servicio"
                placeholder={servicios.length ? 'Elige un servicio' : 'Sin servicios disponibles'}
                data={servicioOptions}
                value={servicioId}
                onChange={setServicioId}
                allowDeselect={false}
                checkIconPosition="right"
                disabled={servicios.length === 0}
              />

              <Radio.Group
                label="Prioridad"
                value={prioridad}
                onChange={setPrioridad}
                description="Preferente: gestante, adulto mayor o persona con discapacidad."
              >
                <Group mt="xs" gap="sm">
                  <Radio value={PRIORIDADES.NORMAL} label="Normal" />
                  <Radio value={PRIORIDADES.PREFERENCIAL} label="Preferente" />
                </Group>
              </Radio.Group>

              <Button
                leftSection={<IconTicket size={18} />}
                onClick={pedirTurno}
                loading={creando}
                disabled={!servicioId}
                mt="xs"
              >
                Generar turno
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <Group justify="space-between" mb="sm">
            <Title order={4}>Mis turnos activos</Title>
            {loading && <Loader size="xs" />}
          </Group>

          {activos.length === 0 ? (
            <Alert variant="light" color="gray" icon={<IconInfoCircle size={18} />}>
              No tienes turnos activos. Genera uno para aparecer en la cola.
            </Alert>
          ) : (
            <Stack gap="sm">
              {activos.map((t) => (
                <TurnoActivoCard key={t.id} turno={t} onAnular={() => anular(t)} />
              ))}
            </Stack>
          )}

          {historial.length > 0 && (
            <>
              <Title order={5} mt="xl" mb="sm" c="dimmed">
                Historial reciente
              </Title>
              <Card padding={0}>
                <Stack gap={0}>
                  {historial.map((t, i) => (
                    <Group
                      key={t.id}
                      justify="space-between"
                      px="md"
                      py="sm"
                      style={{
                        borderTop: i ? '1px solid var(--mantine-color-gray-2)' : 'none',
                      }}
                    >
                      <Group gap="sm">
                        <Text fw={600} ff="monospace">
                          {t.codigo}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {t.servicioNombre}
                        </Text>
                      </Group>
                      <Group gap="sm">
                        <Text size="xs" c="dimmed">
                          {fmtHora(t.finishedAt || t.createdAt)}
                        </Text>
                        <EstadoBadge estado={t.estado} />
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Card>
            </>
          )}
        </Grid.Col>
      </Grid>
    </>
  )
}

function TurnoActivoCard({ turno, onAnular }) {
  const llamado = turno.estado === ESTADOS.LLAMADO || turno.estado === ESTADOS.EN_ATENCION

  return (
    <Card padding="lg" style={llamado ? { borderColor: 'var(--mantine-color-teal-4)' } : undefined}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="md" wrap="nowrap">
          <Stack gap={2} align="center" style={{ minWidth: 88 }}>
            <Text c="dimmed" size="xs" tt="uppercase" fw={600}>
              Turno
            </Text>
            <Text fw={700} fz={28} ff="monospace" lh={1}>
              {turno.codigo}
            </Text>
          </Stack>
          <Stack gap={6}>
            <Text fw={600}>{turno.servicioNombre}</Text>
            <Group gap="xs">
              <EstadoBadge estado={turno.estado} />
              <PrioridadBadge prioridad={turno.prioridad} />
            </Group>
          </Stack>
        </Group>

        <Stack gap={6} align="flex-end">
          {turno.estado === ESTADOS.EN_COLA && turno.posicion != null && (
            <Badge
              size="lg"
              variant="light"
              color={turno.posicion === 1 ? 'teal' : 'blue'}
              leftSection={<IconClockHour4 size={14} />}
            >
              {turno.posicion === 1 ? 'Eres el siguiente' : `${turno.posicion}º en la cola`}
            </Badge>
          )}
          {llamado && (
            <Alert variant="light" color="teal" py={6} px="sm">
              <Text fw={600} size="sm">
                ¡Es tu turno! Acércate a la ventanilla.
              </Text>
            </Alert>
          )}
          {turno.estado === ESTADOS.EN_COLA && (
            <Button
              variant="subtle"
              color="red"
              size="compact-sm"
              leftSection={<IconX size={14} />}
              onClick={onAnular}
            >
              Cancelar
            </Button>
          )}
        </Stack>
      </Group>
    </Card>
  )
}
