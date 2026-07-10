import React, { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const show = useCallback((notification) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newNotification = {
      id,
      title: notification.title,
      message: notification.message,
      color: notification.color || 'blue', // blue, green, red, yellow
      icon: notification.icon,
      duration: notification.duration ?? 4000,
    }

    setNotifications((prev) => [...prev, newNotification])

    if (newNotification.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newNotification.duration)
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
    // Note: this global notifications object is a fallback.
    // In our components we will use the hook `useNotification` where possible,
    // or we can dispatch a custom event to show it dynamically.
    const event = new CustomEvent('app-notification', { detail: opts })
    window.dispatchEvent(event)
  }
}

// A global listener to wire up the notifications object to our React state
export function NotificationListener() {
  const { showNotification } = useNotification()

  React.useEffect(() => {
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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function NotificationItem({ notification, onDismiss }) {
  const { id, title, message, color, icon } = notification

  const colorClasses = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    red: 'bg-rose-50 border-rose-200 text-rose-800',
    yellow: 'bg-amber-50 border-amber-200 text-amber-800',
    blue: 'bg-sky-50 border-sky-200 text-sky-800',
    gray: 'bg-slate-50 border-slate-200 text-slate-800',
  }

  const iconColors = {
    green: 'text-emerald-500',
    red: 'text-rose-500',
    yellow: 'text-amber-500',
    blue: 'text-sky-500',
    gray: 'text-slate-500',
  }

  return (
    <div
      className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 pointer-events-auto transition-all duration-300 transform translate-x-0 animate-slide-in ${
        colorClasses[color] || colorClasses.blue
      }`}
      role="alert"
    >
      {icon && <div className={`mt-0.5 shrink-0 ${iconColors[color]}`}>{icon}</div>}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm leading-tight mb-0.5">{title}</p>}
        {message && <p className="text-sm opacity-90 leading-normal">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors text-black/40 hover:text-black/70"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
