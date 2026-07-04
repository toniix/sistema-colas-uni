// Adaptadores: convierten los DTO del backend (inglés) al modelo interno que
// ya usan los componentes del frontend (español). Centralizarlos aquí permite
// que si el backend cambia un nombre de campo, solo se toque este archivo.

export const adaptUser = (u) =>
  u
    ? {
        id: u.id,
        username: u.username,
        email: u.email,
        nombre: u.fullName,
        rol: u.role, // ADMIN | OPERADOR | ESTUDIANTE
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
        estado: t.status, // CREADO | EN_COLA | LLAMADO | EN_ATENCION | ...
        prioridad: t.type, // NORMAL | PREFERENCIAL
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
  accion: a.action, // p. ej. TICKET_STATUS_CHANGED
  entidad: a.entityType,
  entidadId: a.entityId,
  usuario: a.performedBy?.fullName ?? a.performedBy?.username ?? '—',
  usuarioRol: a.performedBy?.role ?? null,
  valorAnterior: a.oldValue ?? null,
  valorNuevo: a.newValue ?? null,
  detalle: a.description ?? '',
  timestamp: a.createdAt,
})
