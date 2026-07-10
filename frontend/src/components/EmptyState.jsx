import React from 'react'
import { IconInbox } from '@tabler/icons-react'

export default function EmptyState({
  icon: Icon = IconInbox,
  title = 'No hay datos disponibles',
  description = 'No encontramos registros para mostrar en este momento.',
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 ${className}`}>
      <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 mb-4">
        <Icon className="w-8 h-8" stroke={1.5} />
      </div>
      <h3 className="font-bold text-slate-800 tracking-tight text-sm">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}
