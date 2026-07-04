// Base de datos en memoria (mock). Simula lo que luego entregará el API REST
// del backend Spring Boot. Se siembra con usuarios, servicios y un día de
// turnos para que reportes/colas/auditoría tengan datos reales.
import { ESTADOS, PRIORIDADES, ROLES, SERVICIOS } from '../lib/constants'
import dayjs from '../lib/format'

// ---- Usuarios ---------------------------------------------------------------
export const usuarios = [
  {
    id: 1,
    nombre: 'Ana Torres',
    email: 'admin@uni.edu.pe',
    password: 'admin123',
    rol: ROLES.ADMIN,
    servicioId: null,
  },
  {
    id: 2,
    nombre: 'Carlos Ramírez',
    email: 'operador@uni.edu.pe',
    password: 'operador123',
    rol: ROLES.OPERADOR,
    servicioId: 2, // Caja
    ventanilla: 'V-01',
  },
  {
    id: 3,
    nombre: 'Lucía Fernández',
    email: 'operador2@uni.edu.pe',
    password: 'operador123',
    rol: ROLES.OPERADOR,
    servicioId: 1, // Biblioteca
    ventanilla: 'V-02',
  },
  {
    id: 4,
    nombre: 'José Huamán',
    email: 'estudiante@uni.edu.pe',
    password: 'estudiante123',
    rol: ROLES.ESTUDIANTE,
    servicioId: null,
    codigoAlumno: '2021100345',
  },
]

// ---- Contadores por servicio (para códigos de turno tipo CAJ-042) ----------
export const contadores = {}
SERVICIOS.forEach((s) => (contadores[s.id] = 0))

const nombresDemo = [
  'María López', 'Pedro Castro', 'Sofía Rojas', 'Diego Mendoza', 'Valeria Díaz',
  'Jorge Vega', 'Camila Flores', 'Luis Paredes', 'Rosa Quispe', 'Andrés Salas',
  'Fiorella Núñez', 'Kevin Ríos', 'Gabriela Soto', 'Marco Chávez', 'Elena Ponce',
  'Raúl Espinoza', 'Nicole Aguirre', 'Bruno Tello', 'Daniela Ríos', 'Iván Cárdenas',
]

export const turnos = []

function nuevoCodigo(servicioId) {
  contadores[servicioId] += 1
  const s = SERVICIOS.find((x) => x.id === servicioId)
  return `${s.codigo}-${String(contadores[servicioId]).padStart(3, '0')}`
}

// ---- Siembra de un día de atención ------------------------------------------
// Genera turnos históricos (finalizados/anulados) desde las 08:00 hasta ahora,
// concentrando carga en horas pico (10-12h y 16-18h) para que "horas pico" luzca.
function seed() {
  const hoy = dayjs().startOf('day')
  const ahora = dayjs()
  let idSeq = 1
  const operadores = usuarios.filter((u) => u.rol === ROLES.OPERADOR)

  for (let hora = 8; hora <= ahora.hour(); hora++) {
    const pico = (hora >= 10 && hora <= 12) || (hora >= 16 && hora <= 18)
    const cantidad = pico ? 7 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 3)

    for (let i = 0; i < cantidad; i++) {
      const servicio = SERVICIOS[Math.floor(Math.random() * SERVICIOS.length)]
      const creado = hoy
        .hour(hora)
        .minute(Math.floor(Math.random() * 60))
        .second(0)
      if (creado.isAfter(ahora)) continue

      const esperaMin = 3 + Math.floor(Math.random() * 22)
      const atencionMin = 2 + Math.floor(Math.random() * 12)
      const llamado = creado.add(esperaMin, 'minute')
      const enAtencion = llamado.add(1, 'minute')
      const finalizado = enAtencion.add(atencionMin, 'minute')

      const prioridad = Math.random() < 0.18 ? PRIORIDADES.PREFERENTE : PRIORIDADES.NORMAL
      const anulado = Math.random() < 0.08

      const opsServicio = operadores.filter((o) => o.servicioId === servicio.id)
      const operador = opsServicio.length
        ? opsServicio[0]
        : operadores[Math.floor(Math.random() * operadores.length)]

      contadores[servicio.id] += 1
      const codigo = `${servicio.codigo}-${String(contadores[servicio.id]).padStart(3, '0')}`

      if (anulado) {
        turnos.push({
          id: idSeq++,
          codigo,
          servicioId: servicio.id,
          estudiante: nombresDemo[Math.floor(Math.random() * nombresDemo.length)],
          prioridad,
          estado: ESTADOS.ANULADO,
          createdAt: creado.toISOString(),
          calledAt: null,
          startedAt: null,
          finishedAt: creado.add(esperaMin, 'minute').toISOString(),
          operadorId: null,
          observacion: 'No se presentó al ser llamado',
          derivadoDe: null,
        })
      } else if (finalizado.isBefore(ahora)) {
        turnos.push({
          id: idSeq++,
          codigo,
          servicioId: servicio.id,
          estudiante: nombresDemo[Math.floor(Math.random() * nombresDemo.length)],
          prioridad,
          estado: ESTADOS.FINALIZADO,
          createdAt: creado.toISOString(),
          calledAt: llamado.toISOString(),
          startedAt: enAtencion.toISOString(),
          finishedAt: finalizado.toISOString(),
          operadorId: operador.id,
          observacion: 'Atención completada',
          derivadoDe: null,
        })
      }
    }
  }

  // Turnos actualmente EN COLA (la cola viva que verá el operador)
  const enColaSpecs = [
    { servicioId: 2, prioridad: PRIORIDADES.PREFERENTE, hace: 12 },
    { servicioId: 2, prioridad: PRIORIDADES.NORMAL, hace: 9 },
    { servicioId: 2, prioridad: PRIORIDADES.NORMAL, hace: 6 },
    { servicioId: 2, prioridad: PRIORIDADES.NORMAL, hace: 2 },
    { servicioId: 1, prioridad: PRIORIDADES.NORMAL, hace: 8 },
    { servicioId: 1, prioridad: PRIORIDADES.PREFERENTE, hace: 5 },
    { servicioId: 3, prioridad: PRIORIDADES.NORMAL, hace: 4 },
    { servicioId: 4, prioridad: PRIORIDADES.NORMAL, hace: 3 },
  ]
  enColaSpecs.forEach((spec) => {
    contadores[spec.servicioId] += 1
    const s = SERVICIOS.find((x) => x.id === spec.servicioId)
    turnos.push({
      id: idSeq++,
      codigo: `${s.codigo}-${String(contadores[spec.servicioId]).padStart(3, '0')}`,
      servicioId: spec.servicioId,
      estudiante: nombresDemo[Math.floor(Math.random() * nombresDemo.length)],
      prioridad: spec.prioridad,
      estado: ESTADOS.EN_COLA,
      createdAt: ahora.subtract(spec.hace, 'minute').toISOString(),
      calledAt: null,
      startedAt: null,
      finishedAt: null,
      operadorId: null,
      observacion: null,
      derivadoDe: null,
    })
  })

  seedIdSeq = idSeq
}

export let seedIdSeq = 1
seed()

export function nextTurnoId() {
  return seedIdSeq++
}

export { nuevoCodigo }

// ---- Auditoría --------------------------------------------------------------
export const auditoria = []
let auditSeq = 1

export function registrarAuditoria({ usuario, accion, resultado = 'OK', detalle = '' }) {
  auditoria.unshift({
    id: auditSeq++,
    usuario,
    accion,
    resultado,
    detalle,
    ip: `10.0.${Math.floor(Math.random() * 5)}.${20 + Math.floor(Math.random() * 200)}`,
    host: 'ventanilla-lan',
    timestamp: new Date().toISOString(),
  })
}

// Algo de auditoría histórica para que la tabla no arranque vacía
;['Ana Torres', 'Carlos Ramírez', 'Lucía Fernández'].forEach((u, i) => {
  registrarAuditoria({
    usuario: u,
    accion: 'LOGIN',
    resultado: 'OK',
    detalle: 'Inicio de sesión',
  })
  auditoria[0].timestamp = dayjs().subtract(30 + i * 7, 'minute').toISOString()
})
registrarAuditoria({
  usuario: 'desconocido@uni.edu.pe',
  accion: 'LOGIN',
  resultado: 'ERROR',
  detalle: 'Credenciales inválidas',
})
auditoria[0].timestamp = dayjs().subtract(52, 'minute').toISOString()
