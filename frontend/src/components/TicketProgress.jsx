import React from 'react'
import { 
  IconClock, 
  IconBellRinging, 
  IconPlayerPlay, 
  IconCheck,
  IconX,
  IconArrowRight
} from '@tabler/icons-react'
import { ESTADOS } from '../lib/constants'

export default function TicketProgress({ estado }) {
  const steps = [
    { key: ESTADOS.EN_COLA, label: 'En cola', icon: IconClock },
    { key: ESTADOS.LLAMADO, label: 'Llamado', icon: IconBellRinging },
    { key: ESTADOS.EN_ATENCION, label: 'En atención', icon: IconPlayerPlay },
    { key: ESTADOS.FINALIZADO, label: 'Finalizado', icon: IconCheck },
  ]

  const getStepIndex = (est) => {
    if (est === ESTADOS.CREADO) return 0
    if (est === ESTADOS.EN_COLA) return 0
    if (est === ESTADOS.LLAMADO) return 1
    if (est === ESTADOS.EN_ATENCION) return 2
    if (est === ESTADOS.FINALIZADO) return 3
    return -1
  }

  const currentIndex = getStepIndex(estado)

  // Handlers for terminal states
  if (estado === ESTADOS.ANULADO) {
    return (
      <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl p-4 text-rose-800">
        <IconX className="w-5.5 h-5.5 text-rose-500 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Turno Anulado</h4>
          <p className="text-xs text-rose-600">Este turno ha sido cancelado o anulado del sistema.</p>
        </div>
      </div>
    )
  }

  if (estado === ESTADOS.DERIVADO) {
    return (
      <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl p-4 text-violet-800">
        <IconArrowRight className="w-5.5 h-5.5 text-violet-500 shrink-0 animate-pulse" />
        <div>
          <h4 className="font-bold text-sm">Turno Derivado</h4>
          <p className="text-xs text-violet-600">El turno ha sido transferido a otra ventanilla de atención.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4">
      {/* Horizontal layout */}
      <div className="flex items-center justify-between relative w-full">
        {steps.map((step, idx) => {
          const StepIcon = step.icon
          const isCompleted = idx < currentIndex
          const isActive = idx === currentIndex
          const isPending = idx > currentIndex

          return (
            <React.Fragment key={step.key}>
              {/* Step circle */}
              <div className="flex flex-col items-center flex-1 relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-100' 
                      : isActive 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 animate-pulse' 
                        : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                <span 
                  className={`text-[10px] sm:text-xs font-bold mt-2 text-center tracking-tight transition-colors ${
                    isActive 
                      ? 'text-indigo-600' 
                      : isCompleted 
                        ? 'text-slate-700' 
                        : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 -z-0">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500 ease-in-out"
                    style={{ 
                      width: `${(Math.max(0, Math.min(steps.length - 1, currentIndex)) / (steps.length - 1)) * 100}%` 
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
