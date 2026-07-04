import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Select,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import * as api from '../../api/client'
import { fmtFechaHora } from '../../lib/format'
import PageHeader from '../../components/PageHeader'

const ACCION_COLOR = {
  LOGIN: 'blue',
  CREAR_TURNO: 'teal',
  LLAMAR: 'yellow',
  INICIAR_ATENCION: 'cyan',
  FINALIZAR: 'green',
  DERIVAR: 'grape',
  ANULAR: 'red',
}

const ACCION_LABEL = {
  LOGIN: 'Login',
  CREAR_TURNO: 'Crear turno',
  LLAMAR: 'Llamar',
  INICIAR_ATENCION: 'Iniciar atención',
  FINALIZAR: 'Finalizar',
  DERIVAR: 'Derivar',
  ANULAR: 'Anular',
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState(null)
  const [q, setQ] = useState('')
  const [accion, setAccion] = useState('')

  useEffect(() => {
    api.listAuditoria().then(setRegistros)
    const iv = setInterval(() => api.listAuditoria().then(setRegistros), 5000)
    return () => clearInterval(iv)
  }, [])

  const filtrados = useMemo(() => {
    if (!registros) return []
    return registros.filter((r) => {
      if (accion && r.accion !== accion) return false
      if (q) {
        const t = `${r.usuario} ${r.detalle} ${r.ip}`.toLowerCase()
        if (!t.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [registros, q, accion])

  if (!registros) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    )
  }

  return (
    <>
      <PageHeader
        title="Auditoría"
        subtitle="Registro de acciones: login, turnos, llamados, cierres y derivaciones"
      />

      <Group mb="md" gap="sm">
        <TextInput
          placeholder="Buscar usuario, detalle o IP…"
          leftSection={<IconSearch size={16} />}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          w={280}
        />
        <Select
          placeholder="Todas las acciones"
          clearable
          data={Object.entries(ACCION_LABEL).map(([value, label]) => ({ value, label }))}
          value={accion}
          onChange={(v) => setAccion(v || '')}
          w={200}
        />
        <Text size="sm" c="dimmed" ml="auto">
          {filtrados.length} registro{filtrados.length === 1 ? '' : 's'}
        </Text>
      </Group>

      <Card padding={0}>
        <Table.ScrollContainer minWidth={720}>
          <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha / hora</Table.Th>
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Acción</Table.Th>
                <Table.Th>Detalle</Table.Th>
                <Table.Th>IP / host</Table.Th>
                <Table.Th>Resultado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtrados.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                      {fmtFechaHora(r.timestamp)}
                    </Text>
                  </Table.Td>
                  <Table.Td fw={600} fz="sm">
                    {r.usuario}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={ACCION_COLOR[r.accion] || 'gray'} size="sm">
                      {ACCION_LABEL[r.accion] || r.accion}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{r.detalle}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {r.ip}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="dot"
                      color={r.resultado === 'OK' ? 'green' : 'red'}
                      size="sm"
                    >
                      {r.resultado}
                    </Badge>
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
