import { Button, Center, Stack, Text, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { rutaInicioPorRol } from '../lib/rutas'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  return (
    <Center h="100vh" p="md">
      <Stack align="center" gap="sm">
        <Title order={1} fz={64} c="teal">
          404
        </Title>
        <Text c="dimmed">La página que buscas no existe.</Text>
        <Button
          mt="sm"
          onClick={() =>
            navigate(isAuthenticated ? rutaInicioPorRol(user.rol) : '/login')
          }
        >
          Volver al inicio
        </Button>
      </Stack>
    </Center>
  )
}
