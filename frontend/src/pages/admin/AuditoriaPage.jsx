import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
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
import { IconAlertTriangle, IconArrowRight, IconSearch } from '@tabler/icons-react'
import * as api from '../../api/client'
import { fmtFechaHora } from '../../lib/format'
import PageHeader from '../../components/PageHeader'

// Color por prefijo de acción (las acciones del backend son dinámicas)
function colorAccion(accion = '') {
  if (accion.includes('LOGIN') || accion.includes('AUTH')) return 'blue'
  if (accion.includes('CREATE') || accion.includes('CREATED')) return 'teal'
  if (accion.includes('CANCEL') || accion.includes('DELETE')) return 'red'
  if (accion.includes('DERIV')) return 'grape'
  if (accion.includes('STATUS') || accion.includes('CHANGED')) return 'yellow'
  return 'gray'
}

const prettyAccion = (a = '') =>
  a
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [accion, setAccion] = useState('')

  const cargar = useCallback(async () => {
    try {
      const { items } = await api.listAuditoria({ size: 200 })
      setRegistros(items)
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

  const acciones = useMemo(
    () => [...new Set((registros || []).map((r) => r.accion))].filter(Boolean),
    [registros],
  )

  const filtrados = useMemo(() => {
    if (!registros) return []
    return registros.filter((r) => {
      if (accion && r.accion !== accion) return false
      if (q) {
        const t = `${r.usuario} ${r.detalle} ${r.entidad}`.toLowerCase()
        if (!t.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [registros, q, accion])

  if (error) {
    return (
      <>
        <PageHeader title="Auditoría" />
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />} title="Error de conexión">
          {error}
        </Alert>
      </>
    )
  }

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
        subtitle="Registro de acciones del sistema (turnos, usuarios, sesiones)"
      />

      <Group mb="md" gap="sm">
        <TextInput
          placeholder="Buscar usuario, detalle o entidad…"
          leftSection={<IconSearch size={16} />}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          w={300}
        />
        <Select
          placeholder="Todas las acciones"
          clearable
          data={acciones.map((a) => ({ value: a, label: prettyAccion(a) }))}
          value={accion}
          onChange={(v) => setAccion(v || '')}
          w={220}
        />
        <Text size="sm" c="dimmed" ml="auto">
          {filtrados.length} registro{filtrados.length === 1 ? '' : 's'}
        </Text>
      </Group>

      <Card padding={0}>
        <Table.ScrollContainer minWidth={760}>
          <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha / hora</Table.Th>
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Acción</Table.Th>
                <Table.Th>Detalle</Table.Th>
                <Table.Th>Cambio</Table.Th>
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
                  <Table.Td>
                    <Text fw={600} fz="sm">
                      {r.usuario}
                    </Text>
                    {r.usuarioRol && (
                      <Text size="xs" c="dimmed">
                        {r.usuarioRol}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={colorAccion(r.accion)} size="sm">
                      {prettyAccion(r.accion)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{r.detalle || '—'}</Text>
                    {r.entidad && (
                      <Text size="xs" c="dimmed">
                        {r.entidad}
                        {r.entidadId ? ` #${r.entidadId}` : ''}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {r.valorAnterior || r.valorNuevo ? (
                      <Group gap={6} wrap="nowrap">
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {r.valorAnterior || '—'}
                        </Text>
                        <IconArrowRight size={13} />
                        <Text size="xs" fw={600} style={{ whiteSpace: 'nowrap' }}>
                          {r.valorNuevo || '—'}
                        </Text>
                      </Group>
                    ) : (
                      <Text size="xs" c="dimmed">
                        —
                      </Text>
                    )}
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
