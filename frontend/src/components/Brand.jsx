import React from 'react'
import { useBranding } from '../context/BrandingContext'

export function KhipuIcon({ size = 'md', className = '' }) {
  const sizeMap = {
    xs: 18,
    sm: 32,
    md: 36,
    lg: 48
  }
  const side = sizeMap[size] || 36
  
  return (
    <svg
      width={side}
      height={side}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
    >
      {/* Fondo azul marino/índigo profundo redondeado */}
      <rect width="100" height="100" rx="28" fill="#12183a" />
      
      {/* Cuerda principal horizontal superior (dorada/amarilla) */}
      <path d="M18 36 C 45 42, 55 42, 82 36" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      
      {/* Nudos en la cuerda horizontal */}
      <rect x="42" y="32" width="16" height="12" rx="4" fill="#FBBF24" />
      <rect x="47" y="31" width="6" height="14" rx="2" fill="#D97706" />

      {/* Cuerdas colgantes */}
      {/* 1. Verde Esmeralda */}
      <path d="M30 40 C 25 55, 23 65, 21 78" stroke="#10B981" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="27.5" cy="52" r="4.5" fill="#10B981" />
      <circle cx="21" cy="74" r="4.5" fill="#047857" />

      {/* 2. Celeste */}
      <path d="M42 41 C 41 55, 37 68, 32 82" stroke="#06B6D4" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="40.5" cy="56" r="4.5" fill="#06B6D4" />
      <circle cx="34" cy="75" r="4.5" fill="#0891B2" />

      {/* 3. Naranja */}
      <path d="M50 41 L 50 85" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="50" cy="58" r="4.5" fill="#F59E0B" />
      <circle cx="50" cy="78" r="4.5" fill="#D97706" />

      {/* 4. Amarillo */}
      <path d="M59 41 C 60 55, 62 68, 65 80" stroke="#FBBF24" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="60" cy="54" r="4.5" fill="#FBBF24" />
      <circle cx="63.5" cy="72" r="4.5" fill="#D97706" />

      {/* 5. Morado */}
      <path d="M69 39 C 74 54, 78 65, 80 78" stroke="#8B5CF6" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="72.5" cy="52" r="4.5" fill="#8B5CF6" />
      <circle cx="78.5" cy="71" r="4.5" fill="#6D28D9" />
    </svg>
  )
}

export default function Brand({ size = 'md', dark = false }) {
  const { logoBase64, systemName } = useBranding()
  const isLarge = size === 'lg'
  
  // Si el nombre del sistema es el genérico por defecto, mostramos "Khipu"
  const displayName = systemName === 'Sistema de Colas' ? 'Khipu' : systemName
  
  return (
    <div className="flex items-center gap-3 select-none">
      {logoBase64 ? (
        /* Logo de la Institución si existe */
        <img
          src={logoBase64}
          alt="Logo Institución"
          className={`object-contain rounded-xl transition-all duration-300 shadow-sm shrink-0 bg-white p-1 ${
            isLarge ? 'w-12 h-12' : 'w-9 h-9'
          }`}
        />
      ) : (
        /* Logotipo oficial Khipu por defecto */
        <KhipuIcon size={size} />
      )}

      {/* Nombres y Textos de Marca */}
      <div className="leading-tight">
        <h1 
          className={`font-black tracking-tight ${
            isLarge ? 'text-xl font-black' : 'text-md font-extrabold'
          } ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {displayName}
        </h1>
        <p 
          className={`text-[9px] font-bold tracking-wider uppercase ${
            dark ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          Gestión de Colas
        </p>
      </div>
    </div>
  )
}
