import React from 'react'

export default function Card({
  children,
  className = '',
  padding = 'lg', // sm, md, lg, xl
  withBorder = true,
  shadow = 'sm', // none, sm, md, lg
  onClick,
  ...props
}) {
  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  }

  const shadows = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  }

  const baseStyle = 'bg-white rounded-2xl transition-all duration-200'
  const borderStyle = withBorder ? 'border border-slate-200' : ''
  const hoverStyle = onClick ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${borderStyle} ${shadows[shadow]} ${paddings[padding]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
