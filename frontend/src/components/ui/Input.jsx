import React, { useState } from 'react'

export function TextInput({
  label,
  error,
  leftSection,
  className = '',
  id,
  required,
  ...props
}) {
  const generatedId = id || React.useId()

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={generatedId} className="text-xs font-semibold text-slate-700 tracking-wide">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftSection && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            {leftSection}
          </div>
        )}
        <input
          id={generatedId}
          required={required}
          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
            leftSection ? 'pl-10' : ''
          } ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200'
          }`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-600 mt-0.5">{error}</span>}
    </div>
  )
}

export function PasswordInput({
  label,
  error,
  leftSection,
  className = '',
  id,
  required,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const generatedId = id || React.useId()

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={generatedId} className="text-xs font-semibold text-slate-700 tracking-wide">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftSection && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            {leftSection}
          </div>
        )}
        <input
          id={generatedId}
          required={required}
          type={showPassword ? 'text' : 'password'}
          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
            leftSection ? 'pl-10' : ''
          } pr-10 ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <span className="text-xs text-rose-600 mt-0.5">{error}</span>}
    </div>
  )
}

export function Textarea({
  label,
  error,
  className = '',
  id,
  required,
  minRows = 3,
  ...props
}) {
  const generatedId = id || React.useId()

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={generatedId} className="text-xs font-semibold text-slate-700 tracking-wide">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={generatedId}
        required={required}
        rows={minRows}
        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
          error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-rose-600 mt-0.5">{error}</span>}
    </div>
  )
}

export function Select({
  label,
  error,
  data = [],
  placeholder,
  className = '',
  id,
  required,
  value,
  onChange,
  allowDeselect = false,
  ...props
}) {
  const generatedId = id || React.useId()

  // Normalize data to [{value, label}]
  const options = data.map((item) => {
    if (typeof item === 'string') {
      return { value: item, label: item }
    }
    return item
  })

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={generatedId} className="text-xs font-semibold text-slate-700 tracking-wide">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          id={generatedId}
          required={required}
          value={value ?? ''}
          onChange={handleChange}
          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all appearance-none cursor-pointer ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200'
          }`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled={!allowDeselect}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs text-rose-600 mt-0.5">{error}</span>}
    </div>
  )
}
