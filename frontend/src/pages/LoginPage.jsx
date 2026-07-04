import { useState } from 'react'
import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconLock, IconUser } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { rutaInicioPorRol } from '../lib/rutas'
import Brand from '../components/Brand'

// Usuarios de referencia según el seed del backend. Ajusta si tu equipo usa otros.
const DEMO = [
  { rol: 'Administrador', username: 'admin', password: 'admin123' },
  { rol: 'Operador', username: 'operador', password: 'operador123' },
  { rol: 'Estudiante', username: 'estudiante', password: 'estudiante123' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      navigate(rutaInicioPorRol(user.rol), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function usarDemo(d) {
    setUsername(d.username)
    setPassword(d.password)
    setError('')
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <Stack w="100%" maw={400} gap="lg">
        <Group justify="center">
          <Brand size="lg" />
        </Group>

        <Card padding="xl" radius="md">
          <Title order={3} ta="center">
            Iniciar sesión
          </Title>
          <Text c="dimmed" size="sm" ta="center" mt={4}>
            Sistema de colas y atención universitaria
          </Text>

          <form onSubmit={handleSubmit}>
            <Stack mt="lg" gap="md">
              {error && (
                <Alert
                  variant="light"
                  color="red"
                  icon={<IconAlertCircle size={18} />}
                  py="xs"
                >
                  {error}
                </Alert>
              )}
              <TextInput
                label="Usuario"
                placeholder="tu usuario"
                leftSection={<IconUser size={16} />}
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                required
                autoComplete="username"
              />
              <PasswordInput
                label="Contraseña"
                placeholder="Tu contraseña"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />
              <Button type="submit" loading={loading} fullWidth mt="xs">
                Entrar
              </Button>
            </Stack>
          </form>

          <Divider my="lg" label="Cuentas de demostración" labelPosition="center" />

          <Stack gap="xs">
            {DEMO.map((d) => (
              <Group
                key={d.username}
                justify="space-between"
                wrap="nowrap"
                px="sm"
                py={6}
                style={{
                  border: '1px solid var(--mantine-color-gray-2)',
                  borderRadius: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600}>
                    {d.rol}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {d.username} · {d.password}
                  </Text>
                </div>
                <Anchor component="button" type="button" size="sm" onClick={() => usarDemo(d)}>
                  Usar
                </Anchor>
              </Group>
            ))}
          </Stack>
        </Card>

        <Text ta="center" size="xs" c="dimmed">
          Universidad Nacional · Facultad de Ingeniería de Sistemas
        </Text>
      </Stack>
    </Box>
  )
}
