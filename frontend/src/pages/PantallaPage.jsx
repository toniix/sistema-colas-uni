import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Card,
  Center,
  Grid,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconBellRinging, IconVolume } from '@tabler/icons-react'
import * as api from '../api/client'
import { ESTADOS } from '../lib/constants'
import { fmtHora } from '../lib/format'
import PageHeader from '../components/PageHeader'

export default function PantallaPage() {
  const [colas, setColas] = useState([])
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      const servicios = await api.listServicios()
      const activos = servicios.filter((s) => s.activo)
      const estados = await Promise.all(activos.map((s) => api.colaEstado(s.id)))
      // Solo los servicios que tienen un turno siendo llamado / atendido
      setColas(estados.filter((q) => q.current))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    // cargar() hace setState de forma asíncrona (tras await), no en el cuerpo del efecto
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
    const iv = setInterval(cargar, 3000)
    return () => clearInterval(iv)
  }, [cargar])

  const destacado = colas[0]
  const resto = colas.slice(1)

  return (
    <>
      <PageHeader
        title="Pantalla de turnos"
        subtitle="Turnos siendo llamados y en atención"
        actions={
          <Badge size="lg" variant="dot" color="teal">
            En vivo
          </Badge>
        }
      />

      {error ? (
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />} title="Error de conexión">
          {error}
        </Alert>
      ) : colas.length === 0 ? (
        <Center h={300}>
          <Stack align="center" gap="xs">
            <ThemeIcon variant="light" color="gray" size={54} radius="xl">
              <IconVolume size={26} />
            </ThemeIcon>
            <Text c="dimmed">No hay turnos llamados en este momento.</Text>
          </Stack>
        </Center>
      ) : (
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Card
              padding="xl"
              style={{
                borderColor: 'var(--mantine-color-teal-4)',
                background: 'var(--mantine-color-teal-0)',
              }}
            >
              <Group gap="xs" mb="sm">
                <IconBellRinging size={18} color="var(--mantine-color-teal-7)" />
                <Text fw={600} c="teal.8" tt="uppercase" fz="sm">
                  Llamando ahora
                </Text>
              </Group>
              <Text fw={800} fz={72} ff="monospace" lh={1} c="teal.8">
                {destacado.current.codigo}
              </Text>
              <Text fz="xl" fw={600} mt="sm">
                {destacado.serviceName}
              </Text>
              <Group justify="space-between" mt="md">
                <Text c="dimmed">
                  {destacado.current.operadorNombre || 'Ventanilla'}
                </Text>
                <Badge
                  color={destacado.current.estado === ESTADOS.LLAMADO ? 'yellow' : 'teal'}
                  variant="light"
                >
                  {destacado.current.estado === ESTADOS.LLAMADO ? 'Llamado' : 'En atención'}
                </Badge>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Title order={4} mb="sm" c="dimmed">
              Otros servicios
            </Title>
            {resto.length === 0 ? (
              <Text c="dimmed" size="sm">
                No hay más turnos activos.
              </Text>
            ) : (
              <Grid gutter="md">
                {resto.map((q) => (
                  <Grid.Col span={{ base: 6, sm: 4 }} key={q.serviceId}>
                    <Card padding="md">
                      <Text fw={700} fz={30} ff="monospace" lh={1} c="teal.7">
                        {q.current.codigo}
                      </Text>
                      <Text size="sm" fw={600} mt={6}>
                        {q.serviceName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {q.current.operadorNombre || 'Ventanilla'} · {fmtHora(q.current.calledAt)}
                      </Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Grid.Col>
        </Grid>
      )}
    </>
  )
}
