import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Center,
  Loader,
  Menu,
  SimpleGrid,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { BarChart } from '@mantine/charts'
import {
  IconClockHour4,
  IconDownload,
  IconTicket,
  IconUserCheck,
  IconX,
} from '@tabler/icons-react'
import * as api from '../../api/client'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'
import { exportCSV, exportJSON } from '../../lib/export'

export default function ReportesPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.reportes().then(setData)
  }, [])

  if (!data) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    )
  }

  const { resumen, esperaPorServicio, porOperador, porHora } = data

  function exportar(formato) {
    const payload = {
      generado: new Date().toISOString(),
      resumen,
      esperaPorServicio,
      porOperador,
      porHora,
    }
    if (formato === 'json') {
      exportJSON(payload, 'reporte-colas.json')
    } else {
      // Un CSV plano de espera por servicio (la métrica principal)
      exportCSV(esperaPorServicio, 'reporte-espera-por-servicio.csv')
    }
  }

  return (
    <>
      <PageHeader
        title="Reportes y métricas"
        subtitle="Indicadores de atención del día de hoy"
        actions={
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <Button variant="light" leftSection={<IconDownload size={18} />}>
                Exportar
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => exportar('csv')}>Exportar CSV</Menu.Item>
              <Menu.Item onClick={() => exportar('json')}>Exportar JSON</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        }
      />

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} mb="lg">
        <StatCard label="Turnos hoy" value={resumen.totalHoy} icon={IconTicket} />
        <StatCard label="Atendidos" value={resumen.atendidosHoy} icon={IconUserCheck} color="green" />
        <StatCard label="En cola ahora" value={resumen.enColaAhora} icon={IconClockHour4} color="blue" />
        <StatCard label="Anulados" value={resumen.anuladosHoy} icon={IconX} color="red" />
        <StatCard
          label="Espera media"
          value={resumen.esperaGlobal}
          unit="min"
          icon={IconClockHour4}
          color="teal"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card padding="lg">
          <Title order={4} mb="xs">
            Turnos por hora
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Distribución de la demanda a lo largo del día (horas pico).
          </Text>
          <BarChart
            h={260}
            data={porHora}
            dataKey="hora"
            series={[{ name: 'turnos', color: 'teal.6', label: 'Turnos' }]}
            tickLine="y"
            gridAxis="y"
            barProps={{ radius: 4 }}
          />
        </Card>

        <Card padding="lg">
          <Title order={4} mb="xs">
            Tiempo de espera por servicio
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Promedio de minutos entre creación y llamado.
          </Text>
          <BarChart
            h={260}
            data={esperaPorServicio}
            dataKey="servicio"
            orientation="vertical"
            series={[{ name: 'espera', color: 'blue.6', label: 'Minutos' }]}
            gridAxis="x"
            barProps={{ radius: 4 }}
            valueFormatter={(v) => `${v} min`}
          />
        </Card>
      </SimpleGrid>

      <Card padding="lg" mt="lg">
        <Title order={4} mb="md">
          Atención por operador
        </Title>
        <Table.ScrollContainer minWidth={420}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Operador</Table.Th>
                <Table.Th>Ventanilla</Table.Th>
                <Table.Th ta="right">Turnos atendidos</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {porOperador.map((o) => (
                <Table.Tr key={o.operador}>
                  <Table.Td fw={600}>{o.operador}</Table.Td>
                  <Table.Td>
                    <Text c="dimmed">{o.ventanilla || '—'}</Text>
                  </Table.Td>
                  <Table.Td ta="right" fw={700}>
                    {o.atendidos}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </>
  )
}
