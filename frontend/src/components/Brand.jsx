import { IconRouteSquare } from '@tabler/icons-react'

export default function Brand({ size = 'md', dark = false }) {
  const isLarge = size === 'lg'
  return (
    <div className="flex items-center gap-3 select-none">
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
      <div className="leading-tight">
        <h1 
          className={`font-extrabold tracking-tight ${
            isLarge ? 'text-xl' : 'text-md'
          } ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Queue<span className={dark ? 'text-sky-300' : 'text-indigo-600'}>Flow</span>
        </h1>
        <p 
          className={`text-xs font-medium tracking-wide ${
            dark ? 'text-indigo-200' : 'text-slate-500'
          }`}
        >
          Gestión de Colas
        </p>
      </div>
    </div>
  )
}
