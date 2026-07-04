import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconArrowRight,
  IconBellRinging,
  IconCheck,
  IconInfoCircle,
  IconPlayerPlay,
  IconUsers,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import * as api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ESTADOS, SERVICIOS, servicioById } from '../lib/constants'
import { fmtDuracion, fmtHora } from '../lib/format'
import EstadoBadge from '../components/EstadoBadge'
import PrioridadBadge from '../components/PrioridadBadge'
import PageHeader from '../components/PageHeader'

export default function OperadorPage() {
  const { user } = useAuth()
  const [servicioId, setServicioId] = useState(String(user.servicioId || SERVICIOS[0].id))
  const [cola, setCola] = useState([])
  const [activo, setActivo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // Modales de cierre y derivación
  const [cierre, cierreH] = useDisclosure(false)
  const [deriv, derivH] = useDisclosure(false)
  const [observacion, setObservacion] = useState('')
  const [destino, setDestino] = useState('')

  const cargar = useCallback(async () => {
    const [c, a] = await Promise.all([
      api.colaServicio(Number(servicioId)),
      api.turnoActivoOperador(user.id),
    ])
    setCola(c)
    setActivo(a)
  }, [servicioId, user.id])

  useEffect(() => {
    // setState en callback async (.finally), no síncrono en el cuerpo del efecto
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar().finally(() => setLoading(false))
    const iv = setInterval(cargar, 4000)
    return () => clearInterval(iv)
  }, [cargar])

  async function llamarSiguiente() {
    setBusy(true)
    try {
      const t = await api.llamarSiguiente({ servicioId: Number(servicioId), operador: user })
      notifications.show({
        title: 'Turno llamado',
        message: `${t.codigo} · ${t.estudiante}`,
        color: 'teal',
        icon: <IconBellRinging size={18} />,
      })
      await cargar()
    } catch (e) {
      notifications.show({ title: 'No se pudo llamar', message: e.message, color: 'red' })
    } finally {
      setBusy(false)
    }
  }

  async function iniciar() {
    setBusy(true)
    try {
      await api.iniciarAtencion({ turnoId: activo.id, operador: user })
      await cargar()
    } finally {
      setBusy(false)
    }
  }

  async function finalizar() {
    setBusy(true)
    try {
      await api.finalizarTurno({ turnoId: activo.id, observacion, operador: user })
      notifications.show({ message: `Turno ${activo.codigo} finalizado`, color: 'teal', icon: <IconCheck size={18} /> })
      setObservacion('')
      cierreH.close()
      await cargar()
    } finally {
      setBusy(false)
    }
  }

  async function derivar() {
    if (!destino) return
    setBusy(true)
    try {
      const { destino: nuevo } = await api.derivarTurno({
        turnoId: activo.id,
        servicioDestinoId: Number(destino),
        motivo: observacion || 'Derivación entre servicios',
        operador: user,
      })
      notifications.show({
        title: 'Turno derivado',
        message: `Nuevo turno ${nuevo.codigo} en ${servicioById(nuevo.servicioId).nombre}`,
        color: 'grape',
        icon: <IconArrowRight size={18} />,
      })
      setObservacion('')
      setDestino('')
      derivH.close()
      await cargar()
    } finally {
      setBusy(false)
    }
  }

  const enAtencion = activo?.estado === ESTADOS.EN_ATENCION
  const llamado = activo?.estado === ESTADOS.LLAMADO

  return (
    <>
      <PageHeader
        title="Panel de atención"
        subtitle={`Ventanilla ${user.ventanilla || '—'} · ${user.nombre}`}
        actions={
          <Select
            label="Servicio a atender"
            data={SERVICIOS.map((s) => ({ value: String(s.id), label: s.nombre }))}
            value={servicioId}
            onChange={setServicioId}
            allowDeselect={false}
            w={220}
          />
        }
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
                  No tienes ningún turno en curso. Llama al siguiente de la cola para
                  comenzar.
                </Text>
                <Button
                  mt="sm"
                  size="md"
                  leftSection={<IconBellRinging size={18} />}
                  onClick={llamarSiguiente}
                  loading={busy}
                  disabled={cola.length === 0}
                >
                  Llamar siguiente turno
                </Button>
                {cola.length === 0 && (
                  <Text size="xs" c="dimmed">
                    La cola de {servicioById(Number(servicioId)).nombre} está vacía.
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
                        {servicioById(activo.servicioId).nombre}
                      </Badge>
                    </Group>
                    {activo.derivadoDe && (
                      <Text size="xs" c="grape">
                        Derivado desde {activo.derivadoDe}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      Llamado a las {fmtHora(activo.calledAt)} ·{' '}
                      {enAtencion
                        ? `en atención hace ${fmtDuracion(activo.startedAt)}`
                        : 'esperando inicio'}
                    </Text>
                  </Stack>
                </Group>

                <Group mt="xl" gap="sm">
                  {llamado && (
                    <Button
                      leftSection={<IconPlayerPlay size={18} />}
                      onClick={iniciar}
                      loading={busy}
                    >
                      Iniciar atención
                    </Button>
                  )}
                  {enAtencion && (
                    <>
                      <Button
                        color="teal"
                        leftSection={<IconCheck size={18} />}
                        onClick={cierreH.open}
                      >
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
                  <Button
                    variant="subtle"
                    color="red"
                    ml="auto"
                    onClick={async () => {
                      await api.anularTurno({
                        turnoId: activo.id,
                        motivo: 'Anulado por operador',
                        usuario: user,
                      })
                      await cargar()
                    }}
                  >
                    Anular
                  </Button>
                </Group>
              </>
            )}
          </Card>
        </Grid.Col>

        {/* Cola del servicio */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card padding="lg">
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <Title order={4}>En cola</Title>
                <Badge variant="light" color="blue">
                  {cola.length}
                </Badge>
              </Group>
              {loading && <Loader size="xs" />}
            </Group>

            {cola.length === 0 ? (
              <Alert variant="light" color="gray" icon={<IconInfoCircle size={18} />}>
                No hay turnos en espera.
              </Alert>
            ) : (
              <ScrollArea.Autosize mah={420}>
                <Stack gap={0}>
                  {cola.map((t, i) => (
                    <Group
                      key={t.id}
                      justify="space-between"
                      wrap="nowrap"
                      px="xs"
                      py="sm"
                      style={{
                        borderTop: i ? '1px solid var(--mantine-color-gray-2)' : 'none',
                      }}
                    >
                      <Group gap="sm" wrap="nowrap">
                        <Text c="dimmed" fw={700} w={22} ta="center">
                          {i + 1}
                        </Text>
                        <div>
                          <Text fw={600} ff="monospace">
                            {t.codigo}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {t.estudiante} · {fmtHora(t.createdAt)}
                          </Text>
                        </div>
                      </Group>
                      <PrioridadBadge prioridad={t.prioridad} />
                    </Group>
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            )}

            <Button
              fullWidth
              mt="md"
              variant="light"
              leftSection={<IconBellRinging size={18} />}
              onClick={llamarSiguiente}
              loading={busy}
              disabled={cola.length === 0 || !!activo}
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

      {/* Modal cierre */}
      <Modal opened={cierre} onClose={cierreH.close} title="Finalizar atención" centered>
        <Text size="sm" c="dimmed" mb="md">
          Turno <b>{activo?.codigo}</b> · {activo?.estudiante}
        </Text>
        <Textarea
          label="Observación (motivo/resultado)"
          placeholder="Ej. Trámite completado, documento entregado…"
          value={observacion}
          onChange={(e) => setObservacion(e.currentTarget.value)}
          minRows={3}
          autosize
        />
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={cierreH.close}>
            Cancelar
          </Button>
          <Button color="teal" onClick={finalizar} loading={busy} leftSection={<IconCheck size={16} />}>
            Confirmar cierre
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
            data={SERVICIOS.filter((s) => s.id !== activo?.servicioId).map((s) => ({
              value: String(s.id),
              label: s.nombre,
            }))}
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
