import { useEffect, useState } from 'react'
import {
  Badge,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { IconBuildingBank } from '@tabler/icons-react'
import * as api from '../../api/client'
import PageHeader from '../../components/PageHeader'

export default function ServiciosPage() {
  const [servicios, setServicios] = useState(null)

  useEffect(() => {
    api.listServicios().then(setServicios)
    const iv = setInterval(() => api.listServicios().then(setServicios), 5000)
    return () => clearInterval(iv)
  }, [])

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
        subtitle="Estado en vivo de cada punto de atención"
      />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {servicios.map((s) => (
          <Card key={s.id} padding="lg">
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <ThemeIcon variant="light" color="teal" size={40} radius="md">
                  <IconBuildingBank size={22} stroke={1.6} />
                </ThemeIcon>
                <div>
                  <Text fw={600}>{s.nombre}</Text>
                  <Text size="xs" c="dimmed" ff="monospace">
                    {s.codigo}
                  </Text>
                </div>
              </Group>
            </Group>
            <Group grow>
              <Metric label="En cola" value={s.enCola} color="blue" />
              <Metric label="Atendiendo" value={s.atendiendo} color="teal" />
            </Group>
          </Card>
        ))}
      </SimpleGrid>
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
