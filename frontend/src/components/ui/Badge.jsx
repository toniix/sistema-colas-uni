import React from 'react'

export default function Badge({
  children,
  color = 'slate', // slate, indigo, sky, emerald, amber, rose, violet
  size = 'md', // sm, md, lg
  pulse = false,
  className = '',
  ...props
}) {
  const baseStyle = 'inline-flex items-center gap-1.5 font-semibold rounded-full tracking-wide select-none border'

  const colorClasses = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  const dotColors = {
    indigo: 'bg-indigo-500',
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    slate: 'bg-slate-500',
  }

  return (
    <span
      className={`${baseStyle} ${colorClasses[color] || colorClasses.slate} ${sizes[size]} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[color] || dotColors.slate}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[color] || dotColors.slate}`} />
        </span>
      )}
      {children}
    </span>
  )
}
