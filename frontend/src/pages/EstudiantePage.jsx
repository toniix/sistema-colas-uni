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
  IconCheck,
  IconClockHour4,
  IconInfoCircle,
  IconTicket,
  IconX,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import * as api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import {
  ESTADOS,
  ESTADOS_ACTIVOS,
  PRIORIDADES,
  SERVICIOS,
  servicioById,
} from '../lib/constants'
import { fmtHora } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import PrioridadBadge from '../components/PrioridadBadge'
import PageHeader from '../components/PageHeader'

export default function EstudiantePage() {
  const { user } = useAuth()
  const [servicioId, setServicioId] = useState('2')
  const [prioridad, setPrioridad] = useState(PRIORIDADES.NORMAL)
  const [servicios, setServicios] = useState([])
  const [misTurnos, setMisTurnos] = useState([])
  const [colaPos, setColaPos] = useState({})
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)

  const cargar = useCallback(async () => {
    const [servs, turnos] = await Promise.all([
      api.listServicios(),
      api.listTurnos({ estudiante: user.nombre }),
    ])
    setServicios(servs)
    setMisTurnos(turnos)

    // Posición en cola de los turnos activos del estudiante
    const activos = turnos.filter((t) => t.estado === ESTADOS.EN_COLA)
    const pos = {}
    await Promise.all(
      activos.map(async (t) => {
        const cola = await api.colaServicio(t.servicioId)
        const idx = cola.findIndex((c) => c.id === t.id)
        pos[t.id] = { pos: idx + 1, total: cola.length }
      }),
    )
    setColaPos(pos)
  }, [user.nombre])

  useEffect(() => {
    // setState en callback async (.finally), no síncrono en el cuerpo del efecto
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar().finally(() => setLoading(false))
    const iv = setInterval(cargar, 5000) // refresco de estado en vivo
    return () => clearInterval(iv)
  }, [cargar])

  async function pedirTurno() {
    setCreando(true)
    try {
      const t = await api.crearTurno({
        servicioId: Number(servicioId),
        estudiante: user.nombre,
        prioridad,
        usuario: user.nombre,
      })
      notifications.show({
        title: 'Turno generado',
        message: `Tu turno es ${t.codigo} en ${servicioById(t.servicioId).nombre}`,
        color: 'teal',
        icon: <IconCheck size={18} />,
      })
      setPrioridad(PRIORIDADES.NORMAL)
      await cargar()
    } finally {
      setCreando(false)
    }
  }

  async function anular(t) {
    await api.anularTurno({ turnoId: t.id, motivo: 'Cancelado por el estudiante', usuario: user })
    notifications.show({ message: `Turno ${t.codigo} anulado`, color: 'gray' })
    await cargar()
  }

  const activos = useMemo(
    () => misTurnos.filter((t) => ESTADOS_ACTIVOS.includes(t.estado)),
    [misTurnos],
  )
  const historial = useMemo(
    () => misTurnos.filter((t) => !ESTADOS_ACTIVOS.includes(t.estado)).slice(0, 6),
    [misTurnos],
  )

  const servicioOptions = SERVICIOS.map((s) => {
    const info = servicios.find((x) => x.id === s.id)
    return {
      value: String(s.id),
      label: info ? `${s.nombre} · ${info.enCola} en cola` : s.nombre,
    }
  })

  return (
    <>
      <PageHeader
        title={`Hola, ${user.nombre.split(' ')[0]}`}
        subtitle="Solicita un turno y sigue su estado en tiempo real."
      />

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card padding="lg">
            <Group gap="xs" mb="md">
              <ThemeIcon variant="light" color="teal" radius="md">
                <IconTicket size={18} />
              </ThemeIcon>
              <Title order={4}>Pedir un turno</Title>
            </Group>

            <Stack gap="md">
              <Select
                label="Servicio"
                data={servicioOptions}
                value={servicioId}
                onChange={setServicioId}
                allowDeselect={false}
                checkIconPosition="right"
              />

              <Radio.Group
                label="Prioridad"
                value={prioridad}
                onChange={setPrioridad}
                description="Preferente: gestante, adulto mayor o persona con discapacidad."
              >
                <Group mt="xs" gap="sm">
                  <Radio value={PRIORIDADES.NORMAL} label="Normal" />
                  <Radio value={PRIORIDADES.PREFERENTE} label="Preferente" />
                </Group>
              </Radio.Group>

              <Button
                leftSection={<IconTicket size={18} />}
                onClick={pedirTurno}
                loading={creando}
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
                <TurnoActivoCard
                  key={t.id}
                  turno={t}
                  posicion={colaPos[t.id]}
                  onAnular={() => anular(t)}
                />
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
                          {servicioById(t.servicioId).nombre}
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

function TurnoActivoCard({ turno, posicion, onAnular }) {
  const servicio = servicioById(turno.servicioId)
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
            <Text fw={600}>{servicio.nombre}</Text>
            <Group gap="xs">
              <EstadoBadge estado={turno.estado} />
              <PrioridadBadge prioridad={turno.prioridad} />
            </Group>
          </Stack>
        </Group>

        <Stack gap={6} align="flex-end">
          {turno.estado === ESTADOS.EN_COLA && posicion && (
            <Badge
              size="lg"
              variant="light"
              color={posicion.pos === 1 ? 'teal' : 'blue'}
              leftSection={<IconClockHour4 size={14} />}
            >
              {posicion.pos === 1 ? 'Eres el siguiente' : `${posicion.pos}º en la cola`}
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
