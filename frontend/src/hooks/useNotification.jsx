import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  IconCheck,
  IconInfoCircle,
  IconAlertTriangle,
  IconX,
} from '@tabler/icons-react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const show = useCallback((notification) => {
    const id = Math.random().toString(36).substring(2, 9)
    const duration = notification.duration ?? 4000
    const newNotification = {
      id,
      title: notification.title,
      message: notification.message,
      color: notification.color || 'blue', // blue, green, red, yellow, gray
      icon: notification.icon,
      duration,
    }

    setNotifications((prev) => [...prev, newNotification])

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }, [])

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Compatibility helpers to match Mantine notifications.show API
  const showNotification = useCallback((opts) => {
    // opts: { title, message, color, icon }
    let mappedColor = 'blue'
    if (opts.color === 'teal' || opts.color === 'green') mappedColor = 'green'
    if (opts.color === 'red') mappedColor = 'red'
    if (opts.color === 'yellow' || opts.color === 'amber') mappedColor = 'yellow'
    if (opts.color === 'gray' || opts.color === 'slate') mappedColor = 'gray'

    show({
      title: opts.title,
      message: opts.message || '',
      color: mappedColor,
      icon: opts.icon,
    })
  }, [show])

  return (
    <NotificationContext.Provider value={{ notifications, show, dismiss, showNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

// Simple export of notification client that can be used inside API files or outside React if needed,
// but for React it's best to use context. To allow simple compatibility for notifications.show:
export const notifications = {
  show: (opts) => {
    const event = new CustomEvent('app-notification', { detail: opts })
    window.dispatchEvent(event)
  }
}

// A global listener to wire up the notifications object to our React state
export function NotificationListener() {
  const { showNotification } = useNotification()

  useEffect(() => {
    const handleNotification = (e) => {
      showNotification(e.detail)
    }
    window.addEventListener('app-notification', handleNotification)
    return () => window.removeEventListener('app-notification', handleNotification)
  }, [showNotification])

  return null
}

function NotificationContainer({ notifications, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none sm:bottom-6 sm:right-6">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function NotificationItem({ notification, onDismiss }) {
  const { id, title, message, color, icon, duration } = notification
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (duration <= 0) return
    const step = 20 // Actualizar cada 20ms
    const totalSteps = duration / step
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setProgress(Math.max(0, 100 - (currentStep / totalSteps) * 100))
    }, step)

    return () => clearInterval(timer)
  }, [duration])

  const config = {
    green: {
      bg: 'bg-emerald-50/95 border-emerald-100/80 text-emerald-900',
      border: 'border-emerald-200/60',
      progressBg: 'bg-emerald-500',
      defaultIcon: <IconCheck className="w-5 h-5" />,
      iconColor: 'text-emerald-600 bg-emerald-100/70',
    },
    red: {
      bg: 'bg-rose-50/95 border-rose-100/80 text-rose-900',
      border: 'border-rose-200/60',
      progressBg: 'bg-rose-500',
      defaultIcon: <IconAlertTriangle className="w-5 h-5" />,
      iconColor: 'text-rose-600 bg-rose-100/70',
    },
    yellow: {
      bg: 'bg-amber-50/95 border-amber-100/80 text-amber-900',
      border: 'border-amber-200/60',
      progressBg: 'bg-amber-500',
      defaultIcon: <IconAlertTriangle className="w-5 h-5" />,
      iconColor: 'text-amber-600 bg-amber-100/70',
    },
    blue: {
      bg: 'bg-indigo-50/95 border-indigo-100/80 text-indigo-900',
      border: 'border-indigo-200/60',
      progressBg: 'bg-indigo-500',
      defaultIcon: <IconInfoCircle className="w-5 h-5" />,
      iconColor: 'text-indigo-600 bg-indigo-100/70',
    },
    gray: {
      bg: 'bg-slate-50/95 border-slate-100/80 text-slate-900',
      border: 'border-slate-200/60',
      progressBg: 'bg-slate-500',
      defaultIcon: <IconInfoCircle className="w-5 h-5" />,
      iconColor: 'text-slate-600 bg-slate-100/70',
    },
  }

  const activeConfig = config[color] || config.blue

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border backdrop-blur-md shadow-xl flex items-start gap-3 p-4 pointer-events-auto transition-all duration-300 transform translate-x-0 animate-slide-in-right ${activeConfig.bg} ${activeConfig.border}`}
      role="alert"
    >
      {/* Icon Section */}
      <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${activeConfig.iconColor}`}>
        {icon || activeConfig.defaultIcon}
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 pr-2">
        {title && <p className="font-bold text-sm tracking-tight leading-snug mb-0.5">{title}</p>}
        {message && <p className="text-xs font-medium leading-relaxed opacity-85">{message}</p>}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 p-1 hover:bg-black/5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <IconX className="w-4 h-4" />
      </button>

      {/* Time Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5">
          <div
            className={`h-full transition-all duration-75 ease-linear ${activeConfig.progressBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
