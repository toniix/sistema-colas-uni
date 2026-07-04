import { Group, Text, ThemeIcon } from '@mantine/core'
import { IconRouteSquare } from '@tabler/icons-react'

// Marca del sistema: icono + nombre. Sin gradientes.
export default function Brand({ size = 'md' }) {
  const iconSize = size === 'lg' ? 26 : 20
  return (
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon color="teal" size={size === 'lg' ? 40 : 32} radius="md" variant="filled">
        <IconRouteSquare size={iconSize} stroke={1.8} />
      </ThemeIcon>
      <div style={{ lineHeight: 1.15 }}>
        <Text fw={700} size={size === 'lg' ? 'lg' : 'sm'} lh={1.1}>
          ColasUNI
        </Text>
        <Text size="xs" c="dimmed" lh={1.1}>
          Atención universitaria
        </Text>
      </div>
    </Group>
  )
}
