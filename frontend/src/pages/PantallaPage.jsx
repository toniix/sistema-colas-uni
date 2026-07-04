import { useEffect, useState } from 'react'
import {
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
import { IconBellRinging, IconVolume } from '@tabler/icons-react'
import * as api from '../api/client'
import { ESTADOS, servicioById } from '../lib/constants'
import { fmtHora } from '../lib/format'
import PageHeader from '../components/PageHeader'

export default function PantallaPage() {
  const [turnos, setTurnos] = useState([])

  useEffect(() => {
    const load = () => api.turnosEnPantalla().then(setTurnos)
    load()
    const iv = setInterval(load, 3000)
    return () => clearInterval(iv)
  }, [])

  const destacado = turnos[0]
  const resto = turnos.slice(1)

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

      {turnos.length === 0 ? (
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
                {destacado.codigo}
              </Text>
              <Text fz="xl" fw={600} mt="sm">
                Ventanilla {destacado.ventanilla}
              </Text>
              <Group justify="space-between" mt="md">
                <Text c="dimmed">{servicioById(destacado.servicioId).nombre}</Text>
                <Badge
                  color={destacado.estado === ESTADOS.LLAMADO ? 'yellow' : 'teal'}
                  variant="light"
                >
                  {destacado.estado === ESTADOS.LLAMADO ? 'Llamado' : 'En atención'}
                </Badge>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Title order={4} mb="sm" c="dimmed">
              Otros turnos activos
            </Title>
            {resto.length === 0 ? (
              <Text c="dimmed" size="sm">
                No hay más turnos activos.
              </Text>
            ) : (
              <Grid gutter="md">
                {resto.map((t) => (
                  <Grid.Col span={{ base: 6, sm: 4 }} key={t.id}>
                    <Card padding="md">
                      <Text fw={700} fz={30} ff="monospace" lh={1} c="teal.7">
                        {t.codigo}
                      </Text>
                      <Text size="sm" fw={600} mt={6}>
                        Vent. {t.ventanilla}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {servicioById(t.servicioId).nombre} · {fmtHora(t.calledAt)}
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
