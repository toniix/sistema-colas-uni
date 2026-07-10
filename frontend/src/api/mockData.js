import { getAuth } from '../auth/tokenStore'

// Helper para localStorage
function getStored(key, initial) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : initial
  } catch (e) {
    return initial
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (e) {
    // ignorar
  }
}

// Datos semilla para el Mock DB
const defaultUsers = [
  { id: 1, username: 'admin', email: 'admin@unica.edu.pe', fullName: 'Administrador Sistema Colas', role: 'ADMIN', enabled: true },
  { id: 2, username: 'operador', email: 'operador@unica.edu.pe', fullName: 'Juan Pérez (Operador MAT)', role: 'OPERATOR', enabled: true },
  { id: 3, username: 'estudiante', email: 'estudiante@unica.edu.pe', fullName: 'Carlos Gómez (Estudiante)', role: 'STUDENT', enabled: true }
]

const defaultServices = [
  { id: 1, name: 'Matrícula', description: 'Trámites de matrícula, rectificación e inscripciones', prefix: 'MAT', ticketSequence: 101, assignedOperator: { id: 2, fullName: 'Juan Pérez (Operador MAT)' }, active: true },
  { id: 2, name: 'Tesorería', description: 'Pagos de pensiones, constancias y multas', prefix: 'TES', ticketSequence: 100, assignedOperator: null, active: true },
  { id: 3, name: 'Biblioteca', description: 'Préstamos y devoluciones de libros', prefix: 'BIB', ticketSequence: 100, assignedOperator: null, active: true },
]

const defaultTickets = [
  {
    id: 1,
    ticketCode: 'MAT-101',
    status: 'FINISHED',
    priority: 'NORMAL',
    position: null,
    student: { id: 3, fullName: 'Carlos Gómez (Estudiante)' },
    service: { id: 1, name: 'Matrícula', prefix: 'MAT' },
    operator: { id: 2, fullName: 'Juan Pérez (Operador MAT)' },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    calledAt: new Date(Date.now() - 3000000).toISOString(),
    attendedAt: new Date(Date.now() - 2900000).toISOString(),
    finishedAt: new Date(Date.now() - 1800000).toISOString()
  }
]

const defaultAudit = [
  {
    id: 1,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: 1,
    performedBy: { id: 1, fullName: 'Administrador Sistema Colas', role: 'ADMIN' },
    description: 'Usuario Administrador Semilla Creado',
    createdAt: new Date().toISOString()
  }
]

const defaultSettings = {
  universityName: 'Universidad Nacional',
  systemName: 'Sistema de Colas',
  logoBase64: null,
  coverBase64: null,
  configured: false
}

// Inicializar colecciones reactivas en localStorage
const getUsers = () => getStored('mock_db_users', defaultUsers)
const getSettings = () => getStored('mock_db_settings', defaultSettings)
const setSettings = (settings) => setStored('mock_db_settings', settings)
const setUsers = (users) => setStored('mock_db_users', users)

const getServices = () => getStored('mock_db_services', defaultServices)
const setServices = (services) => setStored('mock_db_services', services)

const getTickets = () => getStored('mock_db_tickets', defaultTickets)
const setTickets = (tickets) => setStored('mock_db_tickets', tickets)

const getAudit = () => getStored('mock_db_audit', defaultAudit)
const setAudit = (audit) => setStored('mock_db_audit', audit)

// ---- SSE Pub/Sub Local ----
const sseListeners = new Set()

export function subscribeMockSse(serviceId, onMessage, isGlobal = false) {
  const listener = { serviceId, onMessage, isGlobal }
  sseListeners.add(listener)
  return () => {
    sseListeners.delete(listener)
  }
}

export function publishMockSse(serviceId, eventType, payload) {
  for (const listener of sseListeners) {
    if (listener.isGlobal || String(listener.serviceId) === String(serviceId)) {
      listener.onMessage(eventType, payload)
    }
  }
}

// Log de Auditoría interno de Mock
function logMockAudit(action, entityType, entityId, description) {
  const audit = getAudit()
  const activeUser = getAuth()?.user || { id: 1, nombre: 'Sistema (Mock)', rol: 'ADMIN' }
  const newLog = {
    id: audit.length ? Math.max(...audit.map(a => a.id)) + 1 : 1,
    action,
    entityType,
    entityId,
    performedBy: {
      id: activeUser.id,
      fullName: activeUser.nombre,
      role: activeUser.rol === 'ADMINISTRADOR' ? 'ADMIN' : activeUser.rol === 'OPERADOR' ? 'OPERATOR' : 'STUDENT'
    },
    description,
    createdAt: new Date().toISOString()
  }
  setAudit([newLog, ...audit])
}

// ---- MOCK API CONTROLLERS ----
export const mockHandlers = {
  // ---- Autenticación ----
  '/api/auth/login': (body) => {
    const users = getUsers()
    const { username, password } = body
    
    // Buscar por username o por email
    const user = users.find(u => (u.username === username || u.email === username))
    
    if (!user) {
      throw new Error('Credenciales incorrectas (Mock)')
    }
    // Aceptar contraseña: username + '123' o operador123, admin123, estudiante123
    const expectedPass = user.username + '123'
    if (password !== expectedPass && password !== 'admin123' && password !== 'operador123' && password !== 'estudiante123') {
      throw new Error('Contraseña incorrecta (Mock)')
    }

    if (!user.enabled) {
      throw new Error('El usuario está deshabilitado')
    }

    const payload = {
      accessToken: 'mock-access-token-' + Math.random().toString(36).substr(2),
      refreshToken: 'mock-refresh-token-' + Math.random().toString(36).substr(2),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        enabled: user.enabled,
        createdAt: new Date().toISOString()
      }
    }
    
    logMockAudit('LOGIN', 'User', user.id, 'Inicio de sesión exitoso (Mock)')
    return payload
  },

  '/api/auth/logout': () => {
    logMockAudit('LOGOUT', 'User', getAuth()?.user?.id || 1, 'Cierre de sesión exitoso (Mock)')
    return null
  },

  '/api/auth/register': (body) => {
    const users = getUsers()
    if (users.some(u => u.username === body.username)) {
      throw new Error('El nombre de usuario ya existe: ' + body.username)
    }
    if (users.some(u => u.email === body.email)) {
      throw new Error('El correo electrónico ya existe: ' + body.email)
    }

    const newUser = {
      id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username: body.username,
      email: body.email,
      fullName: body.fullName,
      role: body.role,
      enabled: true,
      createdAt: new Date().toISOString()
    }
    setUsers([...users, newUser])
    logMockAudit('USER_CREATED', 'User', newUser.id, 'Usuario registrado: ' + newUser.username + ' (Mock)')
    return newUser
  },

  // ---- Usuarios ----
  '/api/users': (body, method) => {
    const users = getUsers()
    return {
      content: users,
      totalElements: users.length,
      totalPages: 1,
      last: true
    }
  },

  '/api/users/(\\d+)': (body, method, match) => {
    const id = parseInt(match[1])
    const users = getUsers()
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) throw new Error('Usuario no encontrado')

    if (method === 'GET') {
      return users[userIndex]
    } else if (method === 'PUT') {
      const updated = { ...users[userIndex], email: body.email, fullName: body.fullName, enabled: body.enabled }
      users[userIndex] = updated
      setUsers(users)
      logMockAudit('USER_UPDATED', 'User', id, 'Usuario actualizado: ' + updated.username + ' (Mock)')
      return updated
    } else if (method === 'DELETE') {
      const deleted = users[userIndex]
      setUsers(users.filter(u => u.id !== id))
      logMockAudit('USER_DELETED', 'User', id, 'Usuario eliminado: ' + deleted.username + ' (Mock)')
      return null
    }
  },

  '/api/users/(\\d+)/toggle-status': (body, method, match) => {
    const id = parseInt(match[1])
    const users = getUsers()
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) throw new Error('Usuario no encontrado')

    users[userIndex].enabled = !users[userIndex].enabled
    setUsers(users)
    logMockAudit('USER_STATUS_TOGGLED', 'User', id, 'Estado de usuario cambiado: ' + users[userIndex].username + ' (Mock)')
    return users[userIndex]
  },

  // ---- Servicios ----
  '/api/services': (body, method) => {
    const services = getServices()
    if (method === 'GET') {
      return {
        content: services,
        totalElements: services.length,
        totalPages: 1,
        last: true
      }
    } else if (method === 'POST') {
      const users = getUsers()
      const assignedOp = body.assignedOperatorId ? users.find(u => u.id === parseInt(body.assignedOperatorId)) : null
      const newService = {
        id: services.length ? Math.max(...services.map(s => s.id)) + 1 : 1,
        name: body.name,
        description: body.description,
        prefix: body.prefix.toUpperCase(),
        ticketSequence: 100,
        assignedOperator: assignedOp ? { id: assignedOp.id, fullName: assignedOp.fullName } : null,
        active: true,
        createdAt: new Date().toISOString()
      }
      setServices([...services, newService])
      logMockAudit('SERVICE_CREATED', 'Service', newService.id, 'Servicio creado: ' + newService.name + ' (Mock)')
      return newService
    }
  },

  '/api/services/(\\d+)': (body, method, match) => {
    const id = parseInt(match[1])
    const services = getServices()
    const srvIndex = services.findIndex(s => s.id === id)
    if (srvIndex === -1) throw new Error('Servicio no encontrado')

    if (method === 'GET') {
      return services[srvIndex]
    } else if (method === 'PUT') {
      const users = getUsers()
      const assignedOp = body.assignedOperatorId ? users.find(u => u.id === parseInt(body.assignedOperatorId)) : null
      const updated = {
        ...services[srvIndex],
        name: body.name,
        description: body.description,
        prefix: body.prefix.toUpperCase(),
        assignedOperator: assignedOp ? { id: assignedOp.id, fullName: assignedOp.fullName } : null
      }
      services[srvIndex] = updated
      setServices(services)
      logMockAudit('SERVICE_UPDATED', 'Service', id, 'Servicio actualizado: ' + updated.name + ' (Mock)')
      return updated
    } else if (method === 'DELETE') {
      const deleted = services[srvIndex]
      setServices(services.filter(s => s.id !== id))
      logMockAudit('SERVICE_DELETED', 'Service', id, 'Servicio eliminado: ' + deleted.name + ' (Mock)')
      return null
    }
  },

  '/api/services/(\\d+)/assign-operator': (body, method, match, searchParams) => {
    const id = parseInt(match[1])
    const operatorId = searchParams.get('operatorId')
    const services = getServices()
    const srvIndex = services.findIndex(s => s.id === id)
    if (srvIndex === -1) throw new Error('Servicio no encontrado')

    const users = getUsers()
    const op = operatorId ? users.find(u => u.id === parseInt(operatorId)) : null

    services[srvIndex].assignedOperator = op ? { id: op.id, fullName: op.fullName } : null
    setServices(services)
    logMockAudit('SERVICE_OPERATOR_ASSIGNED', 'Service', id, op ? `Operador asignado: ${op.fullName} (Mock)` : 'Operador desasignado (Mock)')
    return services[srvIndex]
  },

  // ---- Tickets ----
  '/api/tickets': (body, method) => {
    if (method === 'POST') {
      const services = getServices()
      const srvIndex = services.findIndex(s => s.id === parseInt(body.serviceId))
      if (srvIndex === -1) throw new Error('Servicio no encontrado')

      services[srvIndex].ticketSequence += 1
      const seq = services[srvIndex].ticketSequence
      const prefix = services[srvIndex].prefix
      const ticketCode = `${prefix}-${seq}`
      setServices(services)

      const activeUser = getAuth()?.user || { id: 3, fullName: 'Estudiante Anon' }
      const tickets = getTickets()
      
      // Contar cuántos están en cola para calcular posición
      const queuePosition = tickets.filter(t => t.service.id === services[srvIndex].id && t.status === 'CREATED').length + 1

      const newTicket = {
        id: tickets.length ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
        ticketCode,
        status: 'CREATED',
        priority: body.priority || 'NORMAL',
        position: queuePosition,
        student: { id: activeUser.id, fullName: activeUser.nombre || activeUser.fullName },
        service: { id: services[srvIndex].id, name: services[srvIndex].name, prefix: services[srvIndex].prefix },
        operator: null,
        createdAt: new Date().toISOString()
      }
      
      setTickets([...tickets, newTicket])
      logMockAudit('TICKET_CREATED', 'Ticket', newTicket.id, `Ticket creado: ${ticketCode} para ${newTicket.student.fullName} (Mock)`)
      
      // Notificar SSE
      publishMockSse(services[srvIndex].id, 'QUEUE_UPDATE', { serviceId: services[srvIndex].id })
      publishMockSse('global', 'QUEUE_UPDATE', { serviceId: services[srvIndex].id })

      return newTicket
    }
  },

  '/api/tickets/my': () => {
    const tickets = getTickets()
    const activeUser = getAuth()?.user
    if (!activeUser) return []
    return tickets.filter(t => t.student && t.student.id === activeUser.id)
  },

  '/api/tickets/call-next': () => {
    const activeUser = getAuth()?.user
    if (!activeUser) throw new Error('No autenticado')

    const services = getServices()
    // Buscar servicio asignado al operador actual
    const srv = services.find(s => s.assignedOperator && s.assignedOperator.id === activeUser.id)
    if (!srv) throw new Error('El operador no tiene un servicio asignado')

    const tickets = getTickets()
    // Encontrar el ticket más antiguo con estado CREATED en este servicio
    const sorted = tickets
      .filter(t => t.service.id === srv.id && t.status === 'CREATED')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    if (!sorted.length) {
      throw new Error('No hay tickets en espera para este servicio (Mock)')
    }

    const targetTicket = sorted[0]
    targetTicket.status = 'CALLED'
    targetTicket.operator = { id: activeUser.id, fullName: activeUser.nombre }
    targetTicket.calledAt = new Date().toISOString()
    
    // Recalcular posiciones para el resto en cola
    tickets.forEach(t => {
      if (t.service.id === srv.id && t.status === 'CREATED' && t.position > targetTicket.position) {
        t.position -= 1
      }
    })
    targetTicket.position = null

    setTickets(tickets)
    logMockAudit('TICKET_STATUS_CHANGED', 'Ticket', targetTicket.id, `Llamando ticket: ${targetTicket.ticketCode} (Mock)`)
    
    // Notificar SSE
    publishMockSse(srv.id, 'CALLED', { ticketId: targetTicket.id, serviceId: srv.id })
    publishMockSse('global', 'CALLED', { ticketId: targetTicket.id, serviceId: srv.id })

    return targetTicket
  },

  '/api/tickets/(\\d+)/start': (body, method, match) => {
    const id = parseInt(match[1])
    const tickets = getTickets()
    const ticketIndex = tickets.findIndex(t => t.id === id)
    if (ticketIndex === -1) throw new Error('Ticket no encontrado')

    tickets[ticketIndex].status = 'IN_ATTENTION'
    tickets[ticketIndex].attendedAt = new Date().toISOString()
    setTickets(tickets)

    const t = tickets[ticketIndex]
    logMockAudit('TICKET_STATUS_CHANGED', 'Ticket', id, `Iniciada atención de ticket: ${t.ticketCode} (Mock)`)
    
    publishMockSse(t.service.id, 'IN_ATTENTION', { ticketId: id, serviceId: t.service.id })
    publishMockSse('global', 'IN_ATTENTION', { ticketId: id, serviceId: t.service.id })

    return t
  },

  '/api/tickets/(\\d+)/finish': (body, method, match) => {
    const id = parseInt(match[1])
    const tickets = getTickets()
    const ticketIndex = tickets.findIndex(t => t.id === id)
    if (ticketIndex === -1) throw new Error('Ticket no encontrado')

    tickets[ticketIndex].status = 'FINISHED'
    tickets[ticketIndex].finishedAt = new Date().toISOString()
    setTickets(tickets)

    const t = tickets[ticketIndex]
    logMockAudit('TICKET_STATUS_CHANGED', 'Ticket', id, `Finalizado ticket: ${t.ticketCode} (Mock)`)

    publishMockSse(t.service.id, 'FINISHED', { ticketId: id, serviceId: t.service.id })
    publishMockSse('global', 'FINISHED', { ticketId: id, serviceId: t.service.id })

    return t
  },

  '/api/tickets/(\\d+)/cancel': (body, method, match) => {
    const id = parseInt(match[1])
    const tickets = getTickets()
    const ticketIndex = tickets.findIndex(t => t.id === id)
    if (ticketIndex === -1) throw new Error('Ticket no encontrado')

    tickets[ticketIndex].status = 'CANCELLED'
    tickets[ticketIndex].cancellationObservation = body.observation || 'Anulado (Mock)'
    tickets[ticketIndex].finishedAt = new Date().toISOString()
    setTickets(tickets)

    const t = tickets[ticketIndex]
    logMockAudit('TICKET_STATUS_CHANGED', 'Ticket', id, `Anulado ticket: ${t.ticketCode} por motivo: ${body.observation} (Mock)`)

    publishMockSse(t.service.id, 'CANCELLED', { ticketId: id, serviceId: t.service.id })
    publishMockSse('global', 'CANCELLED', { ticketId: id, serviceId: t.service.id })

    return t
  },

  '/api/tickets/(\\d+)/derive': (body, method, match) => {
    const id = parseInt(match[1])
    const tickets = getTickets()
    const ticketIndex = tickets.findIndex(t => t.id === id)
    if (ticketIndex === -1) throw new Error('Ticket no encontrado')

    const services = getServices()
    const targetService = services.find(s => s.id === parseInt(body.targetServiceId))
    if (!targetService) throw new Error('Servicio destino no encontrado')

    const t = tickets[ticketIndex]
    t.status = 'DERIVED'
    t.derivedToService = { id: targetService.id, name: targetService.name }
    t.derivationReason = body.reason || 'Derivación estándar (Mock)'
    t.finishedAt = new Date().toISOString()

    // Crear un nuevo ticket en el servicio de destino
    targetService.ticketSequence += 1
    const newSeq = targetService.ticketSequence
    const newTicketCode = `${targetService.prefix}-${newSeq}`
    setServices(services)

    const newTicketQueuePos = tickets.filter(ti => ti.service.id === targetService.id && ti.status === 'CREATED').length + 1

    const derivedTicket = {
      id: tickets.length ? Math.max(...tickets.map(ti => ti.id)) + 1 : 1,
      ticketCode: newTicketCode,
      status: 'CREATED',
      priority: t.priority,
      position: newTicketQueuePos,
      student: t.student,
      service: { id: targetService.id, name: targetService.name, prefix: targetService.prefix },
      operator: null,
      createdAt: new Date().toISOString()
    }

    tickets.push(derivedTicket)
    setTickets(tickets)

    logMockAudit('TICKET_STATUS_CHANGED', 'Ticket', id, `Derivado ticket: ${t.ticketCode} a servicio: ${targetService.name} (Mock)`)
    
    publishMockSse(t.service.id, 'DERIVED', { ticketId: id, serviceId: t.service.id })
    publishMockSse(targetService.id, 'QUEUE_UPDATE', { serviceId: targetService.id })
    publishMockSse('global', 'QUEUE_UPDATE', { serviceId: targetService.id })

    return t
  },

  '/api/tickets/queue/(\\d+)': (body, method, match) => {
    const serviceId = parseInt(match[1])
    const services = getServices()
    const srv = services.find(s => s.id === serviceId)
    if (!srv) throw new Error('Servicio no encontrado')

    const tickets = getTickets()
    const serviceTickets = tickets.filter(t => t.service.id === serviceId)
    
    // El ticket actual es el que está CALLED o IN_ATTENTION
    const currentTicket = serviceTickets.find(t => t.status === 'CALLED' || t.status === 'IN_ATTENTION') || null
    const queueSize = serviceTickets.filter(t => t.status === 'CREATED').length
    const estimatedWaitMinutes = queueSize * 5

    return {
      serviceId,
      serviceName: srv.name,
      servicePrefix: srv.prefix,
      currentTicket,
      queueSize,
      estimatedWaitMinutes
    }
  },

  '/api/tickets/history': (body, method) => {
    const tickets = getTickets()
    const sorted = [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return {
      content: sorted,
      totalElements: sorted.length,
      totalPages: 1,
      last: true
    }
  },

  // ---- Auditoría ----
  '/api/audit': () => {
    const audit = getAudit()
    return {
      content: audit,
      totalElements: audit.length,
      totalPages: 1,
      last: true
    }
  },

  // ---- Configuración / Branding ----
  '/api/settings': (body, method) => {
    if (method === 'GET') {
      return getSettings()
    } else if (method === 'PUT') {
      const updated = {
        universityName: body.universityName,
        systemName: body.systemName,
        logoBase64: body.logoBase64,
        coverBase64: body.coverBase64,
        configured: true
      }
      setSettings(updated)
      logMockAudit('SETTINGS_UPDATED', 'SystemSetting', 1, 'Configuración de marca actualizada (Mock)')
      return updated
    }
  }
}

// Interceptor principal de Mock HTTP
export function handleMockRequest(path, opts = {}) {
  const method = opts.method || 'GET'
  const body = opts.body ? JSON.parse(opts.body) : null
  
  // Analizar query parameters
  const [urlPath, queryString] = path.split('?')
  const searchParams = new URLSearchParams(queryString || '')

  // Encontrar un handler que coincida
  for (const [routePattern, handler] of Object.entries(mockHandlers)) {
    const regex = new RegExp('^' + routePattern + '$')
    const match = urlPath.match(regex)
    if (match) {
      console.log(`[MOCK API] ${method} ${path}`, body)
      try {
        // Simular retraso de red de 200ms para realismo
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const res = handler(body, method, match, searchParams)
              resolve(res)
            } catch (e) {
              reject(e)
            }
          }, 200)
        })
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }

  console.error(`[MOCK API] No handler found for ${method} ${path}`)
  return Promise.reject(new Error(`Endpoint de prueba no implementado: ${path}`))
}
