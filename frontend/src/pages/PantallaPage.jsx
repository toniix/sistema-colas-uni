import { useCallback, useEffect, useState } from 'react'
import { IconAlertTriangle, IconVolume, IconVolume3, IconMaximize, IconMinimize } from '@tabler/icons-react'
import * as api from '../api/client'
import { ESTADOS } from '../lib/constants'
import { fmtHora } from '../lib/format'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { useQueueSse } from '../hooks/useQueueSse'
import { adaptTicket } from '../api/adapters'
import { useMemo } from 'react'

export default function PantallaPage() {
  const [error, setError] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastCalledCode, setLastCalledCode] = useState('')

  // Web Audio chime generator
  const playChime = useCallback(() => {
    if (!soundEnabled) return
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      
      const gainNode = audioCtx.createGain()
      gainNode.connect(audioCtx.destination)
      
      // Tone 1: E5
      const osc1 = audioCtx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime)
      osc1.connect(gainNode)
      
      // Tone 2: A5 (offset by 150ms)
      const osc2 = audioCtx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15)
      osc2.connect(gainNode)

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8)

      osc1.start(audioCtx.currentTime)
      osc1.stop(audioCtx.currentTime + 0.8)

      osc2.start(audioCtx.currentTime + 0.15)
      osc2.stop(audioCtx.currentTime + 0.8)
    } catch (e) {
      console.warn('AudioContext not supported or blocked by browser policy:', e)
    }
  }, [soundEnabled])

  const [serviciosActivos, setServiciosActivos] = useState([])
  const [colaPorServicio, setColaPorServicio] = useState({})

  // Cargar lista de servicios activos una sola vez al montar
  useEffect(() => {
    api.listServicios()
      .then((servs) => {
        setServiciosActivos(servs.filter((s) => s.activo))
      })
      .catch((e) => setError(e.message))
  }, [])

  // Derivar la lista de colas activas ordenando los llamados más recientes primero
  const colas = useMemo(() => {
    const list = Object.values(colaPorServicio)
      .filter((q) => q && q.current)
      .sort((a, b) => (b.current.id || 0) - (a.current.id || 0))
    
    if (list.length > 0) {
      const primaryCode = list[0].current.codigo
      if (primaryCode !== lastCalledCode) {
        if (lastCalledCode !== '') playChime()
        setLastCalledCode(primaryCode)
      }
    }
    return list
  }, [colaPorServicio, lastCalledCode, playChime])

  // Suscribirse de forma global al stream SSE público de todas las colas (1 sola conexión HTTP)
  useQueueSse(null, (eventType, payload) => {
    if (payload) {
      setColaPorServicio((prev) => ({
        ...prev,
        [payload.serviceId]: {
          serviceId: payload.serviceId,
          serviceName: payload.serviceName,
          servicePrefix: payload.servicePrefix,
          queueSize: payload.queueSize,
          estimatedWaitMinutes: payload.estimatedWaitMinutes,
          current: payload.currentTicket ? adaptTicket(payload.currentTicket) : null,
        },
      }))
    }
  }, { isPublic: true, isGlobal: true })

  // Timer clock for TV
  useEffect(() => {
    const updateTime = () => {
      const d = new Date()
      setCurrentTime(d.toLocaleTimeString())
    }
    updateTime()
    const tIv = setInterval(updateTime, 1000)
    return () => clearInterval(tIv)
  }, [])

  // Fullscreen controller
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const destacado = colas[0]
  const resto = colas.slice(1)
  const universityName = import.meta.env.VITE_UNIVERSITY_NAME || 'Universidad Nacional'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 sm:p-10 font-sans select-none overflow-hidden justify-between">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-900 pb-5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-sky-500 text-white font-extrabold shadow-lg shadow-sky-500/10">
            <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              PANTALLA EN VIVO
            </h1>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              {universityName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((e) => !e)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Silenciar llamada' : 'Activar timbre de llamada'}
            >
              {soundEnabled ? <IconVolume className="w-5 h-5" /> : <IconVolume3 className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl border bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              title="Pantalla Completa"
            >
              {isFullscreen ? <IconMinimize className="w-5 h-5" /> : <IconMaximize className="w-5 h-5" />}
            </button>
          </div>

          <div className="font-mono text-2xl font-black text-slate-300 tracking-wider">
            {currentTime}
          </div>
        </div>
      </header>

      {/* Main Panel grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 py-8 items-stretch overflow-hidden">
        {error ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-rose-950/40 text-rose-500 border border-rose-900/50 rounded-2xl max-w-md flex items-center gap-3">
              <IconAlertTriangle className="w-6 h-6 shrink-0" />
              <div className="text-left text-xs">
                <span className="font-bold text-sm block mb-0.5">Error de conexión</span>
                Reconectando con el servidor de colas... ({error})
              </div>
            </div>
          </div>
        ) : colas.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-slate-900/40 text-slate-400 border border-slate-900/80 rounded-2xl">
              <p className="text-sm font-semibold">No hay turnos activos</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                Los turnos llamados o en atención aparecerán en esta pantalla automáticamente.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Destacado: LLAMADO AHORA */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="flex-1 bg-gradient-to-br from-indigo-950/80 to-indigo-900/60 rounded-3xl border-2 border-indigo-500/30 p-8 sm:p-12 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                {/* Visual glow backdrop effect */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none translate-x-20 -translate-y-20" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -translate-x-20 translate-y-20" />

                <div className="relative z-10 flex justify-between items-center">
                  <span className="text-xs font-black tracking-widest text-sky-400 uppercase bg-sky-950/50 border border-sky-900/50 px-3 py-1.5 rounded-lg">
                    Llamando ahora
                  </span>
                  <Badge 
                    color={destacado.current.estado === ESTADOS.LLAMADO ? 'amber' : 'emerald'} 
                    size="lg" 
                    pulse={destacado.current.estado === ESTADOS.LLAMADO}
                  >
                    {destacado.current.estado === ESTADOS.LLAMADO ? 'Por Ingresar' : 'En Atención'}
                  </Badge>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center my-6">
                  <div className="text-9xl sm:text-[140px] font-black font-mono tracking-tighter text-white drop-shadow-lg leading-none animate-pulse-slow">
                    {destacado.current.codigo}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-100 tracking-tight mt-4 text-center">
                    {destacado.serviceName}
                  </div>
                </div>

                <div className="relative z-10 flex justify-between items-center border-t border-indigo-900/60 pt-6">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Operador</span>
                    <span className="text-sm font-bold text-white">{destacado.current.operadorNombre || 'Ventanilla'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Hora Llamada</span>
                    <span className="text-sm font-bold text-white font-mono">{fmtHora(destacado.current.calledAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resto de servicios */}
            <div className="lg:w-1/2 flex flex-col justify-start">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 shrink-0 pl-1">
                Otros servicios llamados
              </h2>
              {resto.length === 0 ? (
                <div className="flex-1 border border-dashed border-slate-900 rounded-3xl flex justify-center items-center text-center p-8">
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    No hay más turnos en pantalla en este momento.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-4 auto-rows-max pr-1">
                  {resto.map((q) => (
                    <div 
                      key={q.serviceId} 
                      className="bg-slate-900 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-800 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-sky-400 bg-sky-950/30 px-2 py-0.5 rounded-md border border-sky-950">
                          {q.current.codigo}
                        </span>
                        <Badge 
                          color={q.current.estado === ESTADOS.LLAMADO ? 'amber' : 'emerald'} 
                          size="sm"
                          pulse={q.current.estado === ESTADOS.LLAMADO}
                        >
                          {q.current.estado === ESTADOS.LLAMADO ? 'Llamado' : 'Atendiendo'}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-200 truncate">{q.serviceName}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold truncate">
                          {q.current.operadorNombre || 'Ventanilla'} · {fmtHora(q.current.calledAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center border-t border-slate-900 pt-5 text-[10px] font-bold text-slate-600 tracking-widest uppercase shrink-0">
        Facultad de Ingeniería de Sistemas · Universidad de Colas
      </footer>
    </div>
  )
}
