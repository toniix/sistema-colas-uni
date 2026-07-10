import { useEffect, useRef, useCallback } from 'react'
import { API_URL, garantizarTokenValido } from '../api/http'

/**
 * Hook para suscribirse al stream SSE de la cola de un servicio.
 * 
 * @param {number|string|null} serviceId  - ID del servicio a escuchar
 * @param {function} onMessage            - Callback ejecutado al recibir un evento: (eventType, payload) => void
 * @param {object}   options              - Opciones de configuración
 * @param {boolean}  options.isPublic     - true para PantallaPage (sin JWT), false para estudiante/operador (con JWT)
 */
export function useQueueSse(serviceId, onMessage, { isPublic = false, isGlobal = false } = {}) {
  const abortRef = useRef(null)
  
  // Guardar el callback de mensaje en un ref para evitar ciclos infinitos de reconexión
  // cuando las funciones se definen en línea en el componente padre.
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    // Si no es un canal global y no se suministra un serviceId, no conectar
    if (!isGlobal && !serviceId) return

    // Limpiar cualquier conexión previa
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    if (isPublic) {
      // PantallaPage: Conexión mediante EventSource nativo al endpoint público (sin JWT)
      // Puede ser global para escuchar todos los servicios o específico para uno.
      const url = isGlobal
        ? `${API_URL}/api/sse/public/queues`
        : `${API_URL}/api/sse/public/queue/${serviceId}`
      const es = new EventSource(url)

      const handleEvent = (e) => {
        try {
          const parsed = JSON.parse(e.data)
          onMessageRef.current(e.type, parsed.payload)
        } catch (err) {
          // Ignorar errores de análisis JSON
        }
      }

      const events = ['QUEUE_UPDATE', 'CALLED', 'IN_ATTENTION', 'FINISHED', 'CANCELLED', 'DERIVED']
      events.forEach(evt => es.addEventListener(evt, handleEvent))

      // Cerrar la conexión si se cancela
      signal.addEventListener('abort', () => es.close())
    } else {
      // Estudiante/Operador: fetch + ReadableStream con cabecera de Authorization JWT
      const url = `${API_URL}/api/sse/queue/${serviceId}`

      // Obtener un token de acceso válido (y refrescarlo si es necesario) de forma asíncrona
      garantizarTokenValido().then((token) => {
        if (!token || signal.aborted) return

        fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream'
          },
          signal,
        })
        .then(async (res) => {
          if (!res.ok || !res.body) {
            throw new Error(`SSE request failed with status: ${res.status}`)
          }
          
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done || signal.aborted) break
            
            buffer += decoder.decode(value, { stream: true })

            // Procesar las líneas del stream SSE
            const lines = buffer.split('\n')
            // Conservar la última línea si está incompleta
            buffer = lines.pop()

            let eventType = 'QUEUE_UPDATE'
            let dataLine = null

            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith('event:')) {
                eventType = trimmed.slice(6).trim()
              } else if (trimmed.startsWith('data:')) {
                dataLine = trimmed.slice(5).trim()
              } else if (trimmed === '' && dataLine) {
                try {
                  const parsed = JSON.parse(dataLine)
                  onMessageRef.current(eventType, parsed.payload)
                } catch (err) {
                  // Ignorar
                }
                dataLine = null
              }
            }
          }
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            // Reintentar reconexión automática en 3 segundos en caso de error de conexión
            setTimeout(() => {
              if (!signal.aborted) {
                connect()
              }
            }, 3000)
          }
        })
      }).catch(() => {
        // En caso de fallo definitivo del token (sesión vencida), no reintentar
      })
    }
  }, [serviceId, isPublic, isGlobal]) // Añadido isGlobal a las dependencias

  useEffect(() => {
    connect()
    return () => {
      abortRef.current?.abort()
    }
  }, [connect])
}


