import React, { useEffect, useState } from 'react'

export default function LiveTimer({ desde, className = '' }) {
  const [elapsed, setElapsed] = useState('00:00')

  useEffect(() => {
    if (!desde) {
      setElapsed('00:00')
      return
    }

    const calculateElapsed = () => {
      const startTime = new Date(desde).getTime()
      if (isNaN(startTime)) return '00:00'

      const diffMs = Date.now() - startTime
      if (diffMs < 0) return '00:00'

      const diffSecs = Math.floor(diffMs / 1000)
      const hours = Math.floor(diffSecs / 3600)
      const mins = Math.floor((diffSecs % 3600) / 60)
      const secs = diffSecs % 60

      const pad = (num) => String(num).padStart(2, '0')

      if (hours > 0) {
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}`
      }
      return `${pad(mins)}:${pad(secs)}`
    }

    setElapsed(calculateElapsed())

    const interval = setInterval(() => {
      setElapsed(calculateElapsed())
    }, 1000)

    return () => clearInterval(interval)
  }, [desde])

  return (
    <div className={`inline-flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wider ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
      </span>
      <span>{elapsed}</span>
    </div>
  )
}
