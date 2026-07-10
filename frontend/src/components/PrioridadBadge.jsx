import Badge from './ui/Badge'
import { PRIORIDADES, PRIORIDAD_LABEL } from '../lib/constants'

export default function PrioridadBadge({ prioridad, size = 'md' }) {
  const isPreferencial = prioridad === PRIORIDADES.PREFERENCIAL

  return (
    <Badge
      color={isPreferencial ? 'amber' : 'slate'}
      size={size}
    >
      {isPreferencial && (
        <svg className="w-3.5 h-3.5 text-amber-500 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      {PRIORIDAD_LABEL[prioridad] || 'Normal'}
    </Badge>
  )
}
