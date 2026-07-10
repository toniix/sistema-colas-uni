import Badge from './ui/Badge'
import { ESTADOS, ESTADO_LABEL } from '../lib/constants'

const ESTADO_TAILWIND_COLOR = {
  [ESTADOS.CREADO]: 'slate',
  [ESTADOS.EN_COLA]: 'sky',
  [ESTADOS.LLAMADO]: 'amber',
  [ESTADOS.EN_ATENCION]: 'indigo',
  [ESTADOS.FINALIZADO]: 'emerald',
  [ESTADOS.ANULADO]: 'rose',
  [ESTADOS.DERIVADO]: 'violet',
}

export default function EstadoBadge({ estado, size = 'md' }) {
  const needsPulse = estado === ESTADOS.LLAMADO || estado === ESTADOS.EN_ATENCION
  const color = ESTADO_TAILWIND_COLOR[estado] || 'slate'

  return (
    <Badge color={color} size={size} pulse={needsPulse}>
      {ESTADO_LABEL[estado] || estado}
    </Badge>
  )
}
