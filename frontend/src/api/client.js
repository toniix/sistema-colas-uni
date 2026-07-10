// Cliente de la API REST del backend Sistema de Colas UNI.
// Cada función llama a un endpoint documentado en api_documentation.md y
// devuelve el modelo interno del frontend a través de los adaptadores.
import { http } from './http'
import {
  adaptAuditoria,
  adaptServicio,
  adaptTicket,
  adaptUser,
} from './adapters'
import { ESTADOS } from '../lib/constants'
import { minutosEntre } from '../lib/format'

// Construye un querystring a partir de un objeto ({page,size,sort}) ignorando vacíos.
function qs(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}

// Normaliza una respuesta paginada de Spring (Page<T>) al frontend.
function adaptPage(page, adapt) {
  return {
    items: (page?.content ?? []).map(adapt),
    total: page?.totalElements ?? 0,
    totalPages: page?.totalPages ?? 0,
    last: page?.last ?? true,
  }
}

// ---- Autenticación (/api/auth) ---------------------------------------------
export async function login(username, password) {
  const data = await http.post(
    '/api/auth/login',
    { username, password },
    { auth: false },
  )
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: adaptUser(data.user),
  }
}

export async function logout() {
  // Best-effort: si falla (token ya vencido) no bloquea el cierre de sesión local.
  try {
    await http.post('/api/auth/logout')
  } catch {
    // ignorar
  }
}

export async function registrarUsuario({ username, password, email, fullName, role }) {
  const backendRole = role === 'OPERADOR' ? 'OPERATOR' : role === 'ESTUDIANTE' ? 'STUDENT' : role;
  const data = await http.post('/api/auth/register', {
    username,
    password,
    email,
    fullName,
    role: backendRole,
  })
  return adaptUser(data)
}

// ---- Usuarios (/api/users) — solo ADMIN ------------------------------------
export async function listUsuarios({ page = 0, size = 100, sort = 'fullName,asc' } = {}) {
  const data = await http.get(`/api/users${qs({ page, size, sort })}`)
  return adaptPage(data, adaptUser)
}

export async function getUsuario(id) {
  return adaptUser(await http.get(`/api/users/${id}`))
}

export async function actualizarUsuario(id, { email, fullName, enabled }) {
  return adaptUser(await http.put(`/api/users/${id}`, { email, fullName, enabled }))
}

export async function toggleUsuario(id) {
  return adaptUser(await http.patch(`/api/users/${id}/toggle-status`))
}

export async function eliminarUsuario(id) {
  await http.del(`/api/users/${id}`)
}

// ---- Servicios (/api/services) ---------------------------------------------
export async function listServicios({ page = 0, size = 100 } = {}) {
  const data = await http.get(`/api/services${qs({ page, size })}`)
  return (data?.content ?? []).map(adaptServicio)
}

export async function getServicio(id) {
  return adaptServicio(await http.get(`/api/services/${id}`))
}

export async function crearServicio({ name, description, prefix, assignedOperatorId = null }) {
  return adaptServicio(
    await http.post('/api/services', { name, description, prefix, assignedOperatorId }),
  )
}

export async function actualizarServicio(id, { name, description, prefix, assignedOperatorId }) {
  return adaptServicio(
    await http.put(`/api/services/${id}`, { name, description, prefix, assignedOperatorId }),
  )
}

export async function asignarOperador(id, operatorId) {
  // operatorId omitido => desasigna
  return adaptServicio(
    await http.patch(`/api/services/${id}/assign-operator${qs({ operatorId })}`),
  )
}

export async function eliminarServicio(id) {
  await http.del(`/api/services/${id}`)
}

// ---- Tickets / Turnos (/api/tickets) ---------------------------------------
export async function crearTicket({ serviceId, type }) {
  const priority = type === 'PREFERENCIAL' ? 'PREFERENTE' : 'NORMAL'
  return adaptTicket(await http.post('/api/tickets', { serviceId, priority }))
}

export async function misTurnos() {
  const data = await http.get('/api/tickets/my')
  return (data ?? []).map(adaptTicket)
}

export async function llamarSiguiente() {
  // El backend usa el servicio asignado al operador autenticado (sin parámetros).
  return adaptTicket(await http.post('/api/tickets/call-next'))
}

export async function iniciarAtencion(id) {
  return adaptTicket(await http.patch(`/api/tickets/${id}/start`))
}

export async function finalizarTurno(id) {
  // Nota: el endpoint /finish no recibe observación (ver notas al backend).
  return adaptTicket(await http.patch(`/api/tickets/${id}/finish`))
}

export async function anularTurno(id, observation) {
  return adaptTicket(await http.patch(`/api/tickets/${id}/cancel`, { observation }))
}

export async function derivarTurno(id, { targetServiceId, reason }) {
  return adaptTicket(await http.patch(`/api/tickets/${id}/derive`, { targetServiceId, reason }))
}

// Estado en tiempo real de la cola de un servicio (para paneles/pantalla).
export async function colaEstado(serviceId) {
  const data = await http.get(`/api/tickets/queue/${serviceId}`)
  return {
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    servicePrefix: data.servicePrefix,
    current: data.currentTicket ? adaptTicket(data.currentTicket) : null,
    queueSize: data.queueSize ?? 0,
    estimatedWaitMinutes: data.estimatedWaitMinutes ?? 0,
  }
}

// Historial global de turnos (paginado) — solo ADMIN.
export async function historialTurnos({ page = 0, size = 20, sort = 'createdAt,desc' } = {}) {
  const data = await http.get(`/api/tickets/history${qs({ page, size, sort })}`)
  return adaptPage(data, adaptTicket)
}

// ---- Auditoría (/api/audit) — solo ADMIN -----------------------------------
export async function listAuditoria({ page = 0, size = 50, sort = 'createdAt,desc' } = {}) {
  const data = await http.get(`/api/audit${qs({ page, size, sort })}`)
  return adaptPage(data, adaptAuditoria)
}

// ---- Reportes / métricas ----------------------------------------------------
// El backend aún no expone un endpoint de métricas agregadas, así que se
// calculan en el cliente a partir del historial global de turnos.
export async function reportes() {
  const { items } = await historialTurnos({ page: 0, size: 500, sort: 'createdAt,desc' })
  const finalizados = items.filter((t) => t.estado === ESTADOS.FINALIZADO)

  // Tiempo promedio de espera por servicio (createdAt -> calledAt)
  const porServicioMap = new Map()
  finalizados.forEach((t) => {
    if (!t.calledAt) return
    const key = t.servicioNombre
    const acc = porServicioMap.get(key) || { total: 0, count: 0 }
    acc.total += minutosEntre(t.createdAt, t.calledAt)
    acc.count += 1
    porServicioMap.set(key, acc)
  })
  const esperaPorServicio = [...porServicioMap.entries()].map(([servicio, v]) => ({
    servicio,
    espera: v.count ? Math.round(v.total / v.count) : 0,
    atendidos: v.count,
  }))

  // Cantidad atendida por operador
  const porOperadorMap = new Map()
  finalizados.forEach((t) => {
    const key = t.operadorNombre || 'Sin operador'
    porOperadorMap.set(key, (porOperadorMap.get(key) || 0) + 1)
  })
  const porOperador = [...porOperadorMap.entries()].map(([operador, atendidos]) => ({
    operador,
    atendidos,
  }))

  // Horas pico: turnos creados por hora del día
  const porHora = []
  for (let h = 7; h <= 20; h++) {
    const count = items.filter((t) => new Date(t.createdAt).getHours() === h).length
    porHora.push({ hora: `${String(h).padStart(2, '0')}:00`, turnos: count })
  }

  const esperaGlobal = finalizados.length
    ? Math.round(
        finalizados.reduce((a, t) => a + minutosEntre(t.createdAt, t.calledAt), 0) /
          finalizados.length,
      )
    : 0

  return {
    resumen: {
      totalHoy: items.length,
      atendidosHoy: finalizados.length,
      anuladosHoy: items.filter((t) => t.estado === ESTADOS.ANULADO).length,
      enColaAhora: items.filter((t) => t.estado === ESTADOS.EN_COLA).length,
      esperaGlobal,
    },
    esperaPorServicio,
    porOperador,
    porHora,
  }
}

// ---- Configuración / Branding (/api/settings) -------------------------------
export async function getSettings() {
  return await http.get('/api/settings', { auth: false })
}

export async function saveSettings(data) {
  return await http.put('/api/settings', data)
}
