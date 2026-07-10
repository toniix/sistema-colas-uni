// Mapas de traducción de Backend (inglés) a Frontend (español)
const ROLE_MAP = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERADOR',
  STUDENT: 'ESTUDIANTE',
}

const STATUS_MAP = {
  CREATED: 'CREADO',
  IN_QUEUE: 'EN_COLA',
  CALLED: 'LLAMADO',
  IN_ATTENTION: 'EN_ATENCION',
  FINISHED: 'FINALIZADO',
  CANCELLED: 'ANULADO',
  DERIVED: 'DERIVADO',
}

const PRIORITY_MAP = {
  NORMAL: 'NORMAL',
  PREFERENTE: 'PREFERENCIAL',
}

export const adaptUser = (u) =>
  u
    ? {
        id: u.id,
        username: u.username,
        email: u.email,
        nombre: u.fullName,
        rol: ROLE_MAP[u.role] || u.role, // Traduce a ADMIN | OPERADOR | ESTUDIANTE
        enabled: u.enabled,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }
    : null

export const adaptServicio = (s) =>
  s
    ? {
        id: s.id,
        nombre: s.name,
        descripcion: s.description,
        codigo: s.prefix,
        activo: s.active,
        ticketSequence: s.ticketSequence,
        operadorId: s.assignedOperator?.id ?? null,
        operadorNombre: s.assignedOperator?.fullName ?? null,
        createdAt: s.createdAt,
      }
    : null

export const adaptTicket = (t) =>
  t
    ? {
        id: t.id,
        codigo: t.ticketCode,
        estado: STATUS_MAP[t.status] || t.status, // Traduce los estados a español
        prioridad: PRIORITY_MAP[t.priority] || t.priority, // Traduce a NORMAL | PREFERENCIAL
        posicion: t.position ?? null,
        estudiante: t.student?.fullName ?? '—',
        estudianteId: t.student?.id ?? null,
        servicioId: t.service?.id ?? null,
        servicioNombre: t.service?.name ?? '—',
        servicioPrefix: t.service?.prefix ?? '',
        operadorId: t.operator?.id ?? null,
        operadorNombre: t.operator?.fullName ?? null,
        derivadoA: t.derivedToService?.name ?? null,
        derivacionMotivo: t.derivationReason ?? null,
        observacion: t.cancellationObservation ?? null,
        createdAt: t.createdAt,
        calledAt: t.calledAt,
        startedAt: t.attendedAt, // attendedAt = inicio de atención
        finishedAt: t.finishedAt,
      }
    : null

export const adaptAuditoria = (a) => ({
  id: a.id,
  accion: a.action, // p. ej. TICKET_STATUS_CHANGED o CALL
  entidad: a.entityType,
  entidadId: a.entityId,
  usuario: a.performedBy?.fullName ?? a.performedBy?.username ?? '—',
  usuarioRol: ROLE_MAP[a.performedBy?.role] || a.performedBy?.role || null, // Traduce rol en auditoría
  valorAnterior: a.oldValue ?? null,
  valorNuevo: a.newValue ?? null,
  detalle: a.description ?? '',
  timestamp: a.createdAt,
})

