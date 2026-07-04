import { Badge } from '@mantine/core'
import { PRIORIDADES, PRIORIDAD_LABEL } from '../lib/constants'

export default function PrioridadBadge({ prioridad, size = 'sm' }) {
  if (prioridad === PRIORIDADES.PREFERENCIAL) {
    return (
      <Badge color="orange" variant="filled" size={size} radius="sm">
        Preferente
      </Badge>
    )
  }
  return (
    <Badge color="gray" variant="outline" size={size} radius="sm">
      {PRIORIDAD_LABEL[prioridad] || 'Normal'}
    </Badge>
  )
}
