import { Card, Group, Text, ThemeIcon } from '@mantine/core'

// Tarjeta de métrica sobria: número grande + etiqueta + icono discreto.
export default function StatCard({ label, value, unit, icon: Icon, color = 'teal' }) {
  return (
    <Card padding="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lh={1.4}>
            {label}
          </Text>
          <Text fw={700} fz={30} lh={1.2} mt={4}>
            {value}
            {unit ? (
              <Text span fz="sm" c="dimmed" fw={500} ml={4}>
                {unit}
              </Text>
            ) : null}
          </Text>
        </div>
        {Icon ? (
          <ThemeIcon variant="light" color={color} size={38} radius="md">
            <Icon size={20} stroke={1.7} />
          </ThemeIcon>
        ) : null}
      </Group>
    </Card>
  )
}
