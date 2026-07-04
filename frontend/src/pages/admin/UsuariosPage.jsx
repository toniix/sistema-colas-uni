import { useEffect, useState } from 'react'
import {
  Avatar,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Table,
  Text,
} from '@mantine/core'
import * as api from '../../api/client'
import { ROL_LABEL } from '../../lib/constants'
import PageHeader from '../../components/PageHeader'

const ROL_COLOR = { ADMIN: 'grape', OPERADOR: 'teal', ESTUDIANTE: 'blue' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState(null)

  useEffect(() => {
    api.listUsuarios().then(setUsuarios)
  }, [])

  if (!usuarios) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    )
  }

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Cuentas del sistema y sus roles" />
      <Card padding={0}>
        <Table.ScrollContainer minWidth={560}>
          <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th>Servicio / ventanilla</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {usuarios.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Avatar color={ROL_COLOR[u.rol]} radius="xl" size={36}>
                        {u.nombre
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')}
                      </Avatar>
                      <div>
                        <Text fw={600} size="sm">
                          {u.nombre}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {u.email}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={ROL_COLOR[u.rol]}>
                      {ROL_LABEL[u.rol]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {u.servicioNombre ? (
                      <Text size="sm">
                        {u.servicioNombre}
                        {u.ventanilla ? ` · ${u.ventanilla}` : ''}
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">
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
