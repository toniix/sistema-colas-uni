import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBellRinging,
  IconCheck,
  IconClockHour4,
  IconPlayerPlay,
  IconUsers,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import * as api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ESTADOS } from '../lib/constants'
import { fmtDuracion, fmtHora } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import PrioridadBadge from '../components/PrioridadBadge'
import PageHeader from '../components/PageHeader'

export default function OperadorPage() {
  const { user } = useAuth()
  const [servicios, setServicios] = useState([])
  const [miServicio, setMiServicio] = useState(null)
  const [queue, setQueue] = useState({ queueSize: 0, estimatedWaitMinutes: 0, current: null })
  const [activo, setActivo] = useState(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  // Modales de cancelación y derivación (finish no lleva observación en la API)
  const [cancel, cancelH] = useDisclosure(false)
  const [deriv, derivH] = useDisclosure(false)
  const [observacion, setObservacion] = useState('')
  const [destino, setDestino] = useState('')

  // Identifica el servicio asignado al operador autenticado.
  const cargarServicios = useCallback(async () => {
    const servs = await api.listServicios()
    setServicios(servs)
    const mio = servs.find((s) => s.operadorId === user.id) || null
    setMiServicio(mio)
    return mio
  }, [user.id])

  const refrescarCola = useCallback(
    async (servicio) => {
      const s = servicio || miServicio
      if (!s) return
      const q = await api.colaEstado(s.id)
      setQueue(q)
      // Recupera el turno en curso al recargar la página (si es mío y sigue activo)
      setActivo((prev) => {
        if (prev) return prev
        const c = q.current
        if (c && c.operadorId === user.id && (c.estado === ESTADOS.LLAMADO || c.estado === ESTADOS.EN_ATENCION)) {
          return c
        }
        return prev
      })
    },
    [miServicio, user.id],
  )

  useEffect(() => {
    let iv
    ;(async () => {
      try {
        const mio = await cargarServicios()
        await refrescarCola(mio)
        setError('')
        iv = setInterval(() => refrescarCola(mio).catch(() => {}), 4000)
      } catch (e) {
        setError(e.message)
      } finally {
        setReady(true)
      }
    })()
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargarServicios])

  async function accion(fn, okMsg) {
    setBusy(true)
    try {
      await fn()
      if (okMsg) notifications.show({ ...okMsg })
      await refrescarCola()
    } catch (e) {
      notifications.show({ title: 'No se pudo completar', message: e.message, color: 'red' })
    } finally {
      setBusy(false)
    }
  }

  const llamarSiguiente = () =>
    accion(async () => {
      const t = await api.llamarSiguiente()
      setActivo(t)
      notifications.show({
        title: 'Turno llamado',
        message: `${t.codigo} · ${t.estudiante}`,
        color: 'teal',
        icon: <IconBellRinging size={18} />,
      })
    })

  const iniciar = () =>
    accion(async () => {
      const t = await api.iniciarAtencion(activo.id)
      setActivo(t)
    })

  const finalizar = () =>
    accion(async () => {
      await api.finalizarTurno(activo.id)
      const cod = activo.codigo
      setActivo(null)
      notifications.show({ message: `Turno ${cod} finalizado`, color: 'teal', icon: <IconCheck size={18} /> })
    })

  const anular = () =>
    accion(async () => {
      await api.anularTurno(activo.id, observacion || 'Anulado por el operador')
      const cod = activo.codigo
      setActivo(null)
      setObservacion('')
      cancelH.close()
      notifications.show({ message: `Turno ${cod} anulado`, color: 'gray' })
    })

  const derivar = () =>
    accion(async () => {
      const original = await api.derivarTurno(activo.id, {
        targetServiceId: Number(destino),
        reason: observacion || 'Derivación entre servicios',
      })
      setActivo(null)
      setObservacion('')
      setDestino('')
      derivH.close()
      notifications.show({
        title: 'Turno derivado',
        message: `${original.codigo} → ${original.derivadoA || 'otro servicio'}`,
        color: 'grape',
        icon: <IconArrowRight size={18} />,
      })
    })

  if (error) {
    return (
      <>
        <PageHeader title="Panel de atención" />
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />} title="Error de conexión">
          {error}
        </Alert>
      </>
    )
  }

  if (ready && !miServicio) {
    return (
      <>
        <PageHeader title="Panel de atención" subtitle={user.nombre} />
        <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={18} />} title="Sin servicio asignado">
          Aún no tienes una ventanilla/servicio asignado. Pídele a un administrador que te
          asigne uno para poder atender turnos.
        </Alert>
      </>
    )
  }

  const enAtencion = activo?.estado === ESTADOS.EN_ATENCION
  const llamado = activo?.estado === ESTADOS.LLAMADO

  return (
    <>
      <PageHeader
        title="Panel de atención"
        subtitle={`${user.nombre}${miServicio ? ` · ${miServicio.nombre} (${miServicio.codigo})` : ''}`}
      />

      <Grid gutter="lg">
        {/* Panel de atención actual */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card padding="xl" mih={280}>
            <Group justify="space-between" mb="md">
              <Title order={4}>Atención en curso</Title>
              {activo && <EstadoBadge estado={activo.estado} size="md" />}
            </Group>

            {!activo ? (
              <Stack align="center" justify="center" py="xl" gap="xs">
                <ThemeIcon variant="light" color="gray" size={54} radius="xl">
                  <IconUsers size={26} />
                </ThemeIcon>
                <Text c="dimmed" ta="center" maw={320}>
                  No tienes ningún turno en curso. Llama al siguiente de la cola para comenzar.
                </Text>
                <Button
                  mt="sm"
                  size="md"
                  leftSection={<IconBellRinging size={18} />}
                  onClick={llamarSiguiente}
                  loading={busy}
                  disabled={queue.queueSize === 0}
                >
                  Llamar siguiente turno
                </Button>
                {queue.queueSize === 0 && (
                  <Text size="xs" c="dimmed">
                    La cola de {miServicio?.nombre} está vacía.
                  </Text>
                )}
              </Stack>
            ) : (
              <>
                <Group align="center" gap="xl" mt="sm">
                  <Stack gap={2} align="center">
                    <Text c="dimmed" size="xs" tt="uppercase" fw={600}>
                      Turno
                    </Text>
                    <Text fw={700} fz={52} ff="monospace" lh={1} c="teal">
                      {activo.codigo}
                    </Text>
                  </Stack>
                  <Stack gap={8}>
                    <Text fw={600} fz="lg">
                      {activo.estudiante}
                    </Text>
                    <Group gap="xs">
                      <PrioridadBadge prioridad={activo.prioridad} />
                      <Badge variant="outline" color="gray">
                        {activo.servicioNombre}
                      </Badge>
                    </Group>
                    {activo.derivadoA && (
                      <Text size="xs" c="grape">
                        Derivación relacionada: {activo.derivadoA}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      Llamado a las {fmtHora(activo.calledAt)}
                      {enAtencion && activo.startedAt
                        ? ` · en atención hace ${fmtDuracion(activo.startedAt)}`
                        : ' · esperando inicio'}
                    </Text>
                  </Stack>
                </Group>

                <Group mt="xl" gap="sm">
                  {llamado && (
                    <Button leftSection={<IconPlayerPlay size={18} />} onClick={iniciar} loading={busy}>
                      Iniciar atención
                    </Button>
                  )}
                  {enAtencion && (
                    <>
                      <Button color="teal" leftSection={<IconCheck size={18} />} onClick={finalizar} loading={busy}>
                        Finalizar
                      </Button>
                      <Button
                        variant="light"
                        color="grape"
                        leftSection={<IconArrowRight size={18} />}
                        onClick={derivH.open}
                      >
                        Derivar
                      </Button>
                    </>
                  )}
                  <Button variant="subtle" color="red" ml="auto" onClick={cancelH.open}>
                    Anular
                  </Button>
                </Group>
              </>
            )}
          </Card>
        </Grid.Col>

        {/* Estado de la cola */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card padding="lg">
            <Title order={4} mb="md">
              Cola de {miServicio?.nombre}
            </Title>

            <Group grow mb="md">
              <Stack gap={2} align="center">
                <Text fw={700} fz={40} lh={1} c="blue">
                  {queue.queueSize}
                </Text>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  En espera
                </Text>
              </Stack>
              <Stack gap={2} align="center">
                <Group gap={4} align="baseline">
                  <Text fw={700} fz={40} lh={1}>
                    {queue.estimatedWaitMinutes}
                  </Text>
                  <Text size="sm" c="dimmed">
                    min
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Espera est.
                </Text>
              </Stack>
            </Group>

            {queue.current ? (
              <Card padding="sm" bg="var(--mantine-color-gray-0)">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconClockHour4 size={16} />
                    <Text size="sm" c="dimmed">
                      Atendiendo ahora
                    </Text>
                  </Group>
                  <Text fw={700} ff="monospace">
                    {queue.current.codigo}
                  </Text>
                </Group>
              </Card>
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="xs">
                Nadie en atención en este momento.
              </Text>
            )}

            <Button
              fullWidth
              mt="md"
              variant="light"
              leftSection={<IconBellRinging size={18} />}
              onClick={llamarSiguiente}
              loading={busy}
              disabled={queue.queueSize === 0 || !!activo}
            >
              Llamar siguiente
            </Button>
            {activo && (
              <Text size="xs" c="dimmed" ta="center" mt={6}>
                Cierra el turno actual antes de llamar a otro.
              </Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Modal anular */}
      <Modal opened={cancel} onClose={cancelH.close} title="Anular turno" centered>
        <Text size="sm" c="dimmed" mb="md">
          Turno <b>{activo?.codigo}</b> · {activo?.estudiante}
        </Text>
        <Textarea
          label="Motivo de la anulación"
          placeholder="Ej. El estudiante no se presentó"
          value={observacion}
          onChange={(e) => setObservacion(e.currentTarget.value)}
          minRows={3}
          autosize
        />
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={cancelH.close}>
            Cerrar
          </Button>
          <Button color="red" onClick={anular} loading={busy}>
            Anular turno
          </Button>
        </Group>
      </Modal>

      {/* Modal derivación */}
      <Modal opened={deriv} onClose={derivH.close} title="Derivar a otro servicio" centered>
        <Text size="sm" c="dimmed" mb="md">
          Turno <b>{activo?.codigo}</b> · {activo?.estudiante}
        </Text>
        <Stack gap="md">
          <Select
            label="Servicio destino"
            placeholder="Selecciona un servicio"
            data={servicios
              .filter((s) => s.id !== miServicio?.id && s.activo)
              .map((s) => ({ value: String(s.id), label: s.nombre }))}
            value={destino}
            onChange={setDestino}
          />
          <Textarea
            label="Motivo de la derivación"
            placeholder="Ej. Requiere validación de pago en Caja"
            value={observacion}
            onChange={(e) => setObservacion(e.currentTarget.value)}
            minRows={2}
            autosize
          />
        </Stack>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={derivH.close}>
            Cancelar
          </Button>
          <Button
            color="grape"
            onClick={derivar}
            loading={busy}
            disabled={!destino}
            leftSection={<IconArrowRight size={16} />}
          >
            Derivar turno
          </Button>
        </Group>
      </Modal>
    </>
  )
}
