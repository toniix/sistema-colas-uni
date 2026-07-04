// Capa de acceso a datos. Hoy resuelve contra el mock en memoria (mockDb),
// pero la firma imita un cliente REST: cada función es async y devuelve datos
// planos. Para conectar al backend Spring Boot basta reemplazar el cuerpo por
// llamadas `fetch(`${API_URL}/...`)` sin tocar los componentes.
import {
  auditoria,
  contadores,
  nextTurnoId,
  registrarAuditoria,
  turnos,
  usuarios,
} from './mockDb'
import {
  ESTADOS,
  ESTADOS_ACTIVOS,
  PRIORIDADES,
  SERVICIOS,
  TRANSICIONES,
  servicioById,
} from '../lib/constants'
import { minutosEntre } from '../lib/format'

const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))

// ---- Auth -------------------------------------------------------------------
export async function login(email, password) {
  await delay()
  const u = usuarios.find(
    (x) => x.email.toLowerCase() === email.trim().toLowerCase(),
  )
  if (!u || u.password !== password) {
    registrarAuditoria({
      usuario: email,
      accion: 'LOGIN',
      resultado: 'ERROR',
      detalle: 'Credenciales inválidas',
    })
    throw new Error('Correo o contraseña incorrectos')
  }
  registrarAuditoria({
    usuario: u.nombre,
    accion: 'LOGIN',
    resultado: 'OK',
    detalle: 'Inicio de sesión',
  })
  const { password: _p, ...safe } = u
  // Token simple con expiración (demo). El backend puede emitir JWT real.
  const token = btoa(`${u.id}:${Date.now() + 1000 * 60 * 60 * 8}`)
  return { user: clone(safe), token }
}

// ---- Servicios --------------------------------------------------------------
export async function listServicios() {
  await delay(120)
  return SERVICIOS.map((s) => {
    const enCola = turnos.filter(
      (t) => t.servicioId === s.id && t.estado === ESTADOS.EN_COLA,
    ).length
    const atendiendo = turnos.filter(
      (t) =>
        t.servicioId === s.id &&
        (t.estado === ESTADOS.LLAMADO || t.estado === ESTADOS.EN_ATENCION),
    ).length
    return { ...s, enCola, atendiendo }
  })
}

// ---- Turnos -----------------------------------------------------------------
export async function listTurnos(filtro = {}) {
  await delay(120)
  let data = [...turnos]
  if (filtro.servicioId) data = data.filter((t) => t.servicioId === filtro.servicioId)
  if (filtro.estado) data = data.filter((t) => t.estado === filtro.estado)
  if (filtro.estados) data = data.filter((t) => filtro.estados.includes(t.estado))
  if (filtro.estudiante)
    data = data.filter((t) => t.estudiante === filtro.estudiante)
  return clone(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
}

// Cola ordenada: preferentes primero, luego por orden de llegada
export async function colaServicio(servicioId) {
  await delay(120)
  const cola = turnos
    .filter((t) => t.servicioId === servicioId && t.estado === ESTADOS.EN_COLA)
    .sort((a, b) => {
      if (a.prioridad !== b.prioridad)
        return a.prioridad === PRIORIDADES.PREFERENTE ? -1 : 1
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  return clone(cola)
}

// Turno en atención/llamado por un operador (solo puede tener uno a la vez)
export async function turnoActivoOperador(operadorId) {
  await delay(80)
  const t = turnos.find(
    (x) =>
      x.operadorId === operadorId &&
      (x.estado === ESTADOS.LLAMADO || x.estado === ESTADOS.EN_ATENCION),
  )
  return t ? clone(t) : null
}

export async function crearTurno({ servicioId, estudiante, prioridad, usuario }) {
  await delay()
  contadores[servicioId] += 1
  const s = servicioById(servicioId)
  const codigo = `${s.codigo}-${String(contadores[servicioId]).padStart(3, '0')}`
  const turno = {
    id: nextTurnoId(),
    codigo,
    servicioId,
    estudiante,
    prioridad: prioridad || PRIORIDADES.NORMAL,
    estado: ESTADOS.EN_COLA, // Creado -> En cola de inmediato
    createdAt: new Date().toISOString(),
    calledAt: null,
    startedAt: null,
    finishedAt: null,
    operadorId: null,
    observacion: null,
    derivadoDe: null,
  }
  turnos.push(turno)
  registrarAuditoria({
    usuario: usuario || estudiante,
    accion: 'CREAR_TURNO',
    resultado: 'OK',
    detalle: `Turno ${codigo} · ${s.nombre}`,
  })
  return clone(turno)
}

function findTurno(id) {
  const t = turnos.find((x) => x.id === id)
  if (!t) throw new Error('Turno no encontrado')
  return t
}

// Valida y aplica una transición de estado (bloquea "saltos")
function transicionar(turno, nuevoEstado) {
  const permitidos = TRANSICIONES[turno.estado] || []
  if (!permitidos.includes(nuevoEstado)) {
    throw new Error(
      `Transición inválida: ${turno.estado} → ${nuevoEstado}`,
    )
  }
  turno.estado = nuevoEstado
}

// Operador solicita el siguiente turno de su servicio (lo llama)
export async function llamarSiguiente({ servicioId, operador }) {
  await delay()
  // Regla: un operador solo puede atender un turno a la vez
  const ocupado = turnos.find(
    (t) =>
      t.operadorId === operador.id &&
      (t.estado === ESTADOS.LLAMADO || t.estado === ESTADOS.EN_ATENCION),
  )
  if (ocupado) {
    throw new Error('Ya tienes un turno en curso. Ciérralo o deriva antes de llamar otro.')
  }
  const cola = turnos
    .filter((t) => t.servicioId === servicioId && t.estado === ESTADOS.EN_COLA)
    .sort((a, b) => {
      if (a.prioridad !== b.prioridad)
        return a.prioridad === PRIORIDADES.PREFERENTE ? -1 : 1
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  if (!cola.length) throw new Error('No hay turnos en cola para este servicio')

  const turno = cola[0]
  transicionar(turno, ESTADOS.LLAMADO)
  turno.calledAt = new Date().toISOString()
  turno.operadorId = operador.id
  registrarAuditoria({
    usuario: operador.nombre,
    accion: 'LLAMAR',
    resultado: 'OK',
    detalle: `Turno ${turno.codigo} llamado`,
  })
  return clone(turno)
}

export async function iniciarAtencion({ turnoId, operador }) {
  await delay()
  const turno = findTurno(turnoId)
  transicionar(turno, ESTADOS.EN_ATENCION)
  turno.startedAt = new Date().toISOString()
  registrarAuditoria({
    usuario: operador.nombre,
    accion: 'INICIAR_ATENCION',
    resultado: 'OK',
    detalle: `Turno ${turno.codigo}`,
  })
  return clone(turno)
}

export async function finalizarTurno({ turnoId, observacion, operador }) {
  await delay()
  const turno = findTurno(turnoId)
  transicionar(turno, ESTADOS.FINALIZADO)
  turno.finishedAt = new Date().toISOString()
  turno.observacion = observacion || 'Atención completada'
  registrarAuditoria({
    usuario: operador.nombre,
    accion: 'FINALIZAR',
    resultado: 'OK',
    detalle: `Turno ${turno.codigo} · ${turno.observacion}`,
  })
  return clone(turno)
}

export async function anularTurno({ turnoId, motivo, usuario }) {
  await delay()
  const turno = findTurno(turnoId)
  transicionar(turno, ESTADOS.ANULADO)
  turno.finishedAt = new Date().toISOString()
  turno.observacion = motivo || 'Anulado'
  registrarAuditoria({
    usuario: usuario?.nombre || usuario || 'sistema',
    accion: 'ANULAR',
    resultado: 'OK',
    detalle: `Turno ${turno.codigo} · ${turno.observacion}`,
  })
  return clone(turno)
}

// Deriva el turno actual a otro servicio: cierra el actual como DERIVADO
// y genera un nuevo turno EN_COLA en el servicio destino.
export async function derivarTurno({ turnoId, servicioDestinoId, motivo, operador }) {
  await delay()
  const turno = findTurno(turnoId)
  transicionar(turno, ESTADOS.DERIVADO)
  turno.finishedAt = new Date().toISOString()
  turno.observacion = motivo || 'Derivado'

  contadores[servicioDestinoId] += 1
  const s = servicioById(servicioDestinoId)
  const nuevo = {
    id: nextTurnoId(),
    codigo: `${s.codigo}-${String(contadores[servicioDestinoId]).padStart(3, '0')}`,
    servicioId: servicioDestinoId,
    estudiante: turno.estudiante,
    prioridad: turno.prioridad,
    estado: ESTADOS.EN_COLA,
    createdAt: new Date().toISOString(),
    calledAt: null,
    startedAt: null,
    finishedAt: null,
    operadorId: null,
    observacion: null,
    derivadoDe: turno.codigo,
  }
  turnos.push(nuevo)
  registrarAuditoria({
    usuario: operador.nombre,
    accion: 'DERIVAR',
    resultado: 'OK',
    detalle: `${turno.codigo} → ${nuevo.codigo} (${s.nombre})`,
  })
  return { origen: clone(turno), destino: clone(nuevo) }
}

// Turnos actualmente llamados/en atención (para la pantalla pública)
export async function turnosEnPantalla() {
  await delay(80)
  const data = turnos
    .filter((t) => t.estado === ESTADOS.LLAMADO || t.estado === ESTADOS.EN_ATENCION)
    .sort((a, b) => new Date(b.calledAt) - new Date(a.calledAt))
  return clone(
    data.map((t) => {
      const op = usuarios.find((u) => u.id === t.operadorId)
      return { ...t, ventanilla: op?.ventanilla || '—' }
    }),
  )
}

// ---- Reportes / métricas ----------------------------------------------------
export async function reportes() {
  await delay(200)
  const finalizados = turnos.filter((t) => t.estado === ESTADOS.FINALIZADO)

  // Tiempo promedio de espera por servicio (createdAt -> calledAt)
  const esperaPorServicio = SERVICIOS.map((s) => {
    const items = finalizados.filter((t) => t.servicioId === s.id && t.calledAt)
    const prom = items.length
      ? Math.round(
          items.reduce((acc, t) => acc + minutosEntre(t.createdAt, t.calledAt), 0) /
            items.length,
        )
      : 0
    return { servicio: s.nombre, espera: prom, atendidos: items.length }
  })

  // Cantidad atendida por operador
  const porOperador = usuarios
    .filter((u) => u.rol === 'OPERADOR')
    .map((op) => ({
      operador: op.nombre,
      ventanilla: op.ventanilla,
      atendidos: finalizados.filter((t) => t.operadorId === op.id).length,
    }))

  // Horas pico: turnos creados por hora del día
  const porHora = []
  for (let h = 8; h <= 19; h++) {
    const count = turnos.filter((t) => new Date(t.createdAt).getHours() === h).length
    porHora.push({ hora: `${String(h).padStart(2, '0')}:00`, turnos: count })
  }

  const totalHoy = turnos.length
  const atendidosHoy = finalizados.length
  const anuladosHoy = turnos.filter((t) => t.estado === ESTADOS.ANULADO).length
  const enColaAhora = turnos.filter((t) => t.estado === ESTADOS.EN_COLA).length
  const esperaGlobal = finalizados.length
    ? Math.round(
        finalizados.reduce((a, t) => a + minutosEntre(t.createdAt, t.calledAt), 0) /
          finalizados.length,
      )
    : 0

  return {
    resumen: { totalHoy, atendidosHoy, anuladosHoy, enColaAhora, esperaGlobal },
    esperaPorServicio,
    porOperador,
    porHora,
  }
}

// ---- Auditoría --------------------------------------------------------------
export async function listAuditoria() {
  await delay(120)
  return clone(auditoria)
}

// ---- Usuarios ---------------------------------------------------------------
export async function listUsuarios() {
  await delay(120)
  return clone(
    usuarios.map(({ password: _p, ...u }) => ({
      ...u,
      servicioNombre: u.servicioId ? servicioById(u.servicioId)?.nombre : null,
    })),
  )
}

export { ESTADOS_ACTIVOS }
