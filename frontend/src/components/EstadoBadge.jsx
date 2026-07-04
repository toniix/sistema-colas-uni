import { Badge } from '@mantine/core'
import { ESTADO_COLOR, ESTADO_LABEL } from '../lib/constants'

export default function EstadoBadge({ estado, size = 'sm' }) {
  return (
    <Badge color={ESTADO_COLOR[estado] || 'gray'} variant="light" size={size} radius="sm">
      {ESTADO_LABEL[estado] || estado}
    </Badge>
  )
}
