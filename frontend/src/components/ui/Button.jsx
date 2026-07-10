import React from 'react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  leftSection,
  rightSection,
  type = 'button',
  ...props
}) {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:ring-indigo-500 border border-transparent',
    secondary: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 focus:ring-indigo-300 border border-transparent',
    outline: 'border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-slate-400',
    ghost: 'hover:bg-slate-100 text-slate-600 focus:ring-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 border border-transparent',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500 border border-transparent',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm focus:ring-amber-500 border border-transparent',
    lightDanger: 'bg-rose-50 hover:bg-rose-100 text-rose-700 focus:ring-rose-300 border border-transparent',
    lightSuccess: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 focus:ring-emerald-300 border border-transparent',
    lightWarning: 'bg-amber-50 hover:bg-amber-100 text-amber-800 focus:ring-amber-300 border border-transparent',
    lightPurple: 'bg-violet-50 hover:bg-violet-100 text-violet-700 focus:ring-violet-300 border border-transparent',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  }

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftSection ? (
        <span className="mr-2 inline-flex items-center">{leftSection}</span>
      ) : null}
      
      {children}
      
      {!loading && rightSection && (
        <span className="ml-2 inline-flex items-center">{rightSection}</span>
      )}
    </button>
  )
}
