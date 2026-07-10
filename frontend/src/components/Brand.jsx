import { IconRouteSquare } from '@tabler/icons-react'
import { useBranding } from '../context/BrandingContext'

export default function Brand({ size = 'md', dark = false }) {
  const { logoBase64, systemName } = useBranding()
  const isLarge = size === 'lg'
  
  return (
    <div className="flex items-center gap-3 select-none">
      {logoBase64 ? (
        <img
          src={logoBase64}
          alt="Logo"
          className={`object-contain rounded-xl transition-all duration-300 shadow-sm shrink-0 bg-white p-1 ${
            isLarge ? 'w-12 h-12' : 'w-9 h-9'
          }`}
        />
      ) : (
        <div 
          className={`flex items-center justify-center rounded-xl transition-all duration-300 shadow-md shrink-0 ${
            isLarge ? 'w-12 h-12' : 'w-9 h-9'
          } ${
            dark 
              ? 'bg-sky-500 text-white' 
              : 'bg-indigo-600 text-white'
          }`}
        >
          <IconRouteSquare size={isLarge ? 28 : 22} stroke={1.8} />
        </div>
      )}
      <div className="leading-tight">
        <h1 
          className={`font-extrabold tracking-tight ${
            isLarge ? 'text-xl font-black' : 'text-md font-extrabold'
          } ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {systemName}
        </h1>
        <p 
          className={`text-[10px] font-semibold tracking-widest uppercase ${
            dark ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          Gestión de Colas
        </p>
      </div>
    </div>
  )
}
