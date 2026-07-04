// Roles del sistema (coinciden con el backend: Administrador, Operador, Estudiante)
export const ROLES = {
  ADMIN: 'ADMIN',
  OPERADOR: 'OPERADOR',
  ESTUDIANTE: 'ESTUDIANTE',
}

export const ROL_LABEL = {
  ADMIN: 'Administrador',
  OPERADOR: 'Operador',
  ESTUDIANTE: 'Estudiante',
}

// Los servicios/ventanillas ahora son dinámicos: se obtienen del backend
// vía GET /api/services (ver src/api/client.js -> listServicios).

// Estados del turno. El flujo NO permite saltos:
// CREADO -> EN_COLA -> LLAMADO -> EN_ATENCION -> FINALIZADO
// Ramas terminales adicionales: ANULADO, DERIVADO
export const ESTADOS = {
  CREADO: 'CREADO',
  EN_COLA: 'EN_COLA',
  LLAMADO: 'LLAMADO',
  EN_ATENCION: 'EN_ATENCION',
  FINALIZADO: 'FINALIZADO',
  ANULADO: 'ANULADO',
  DERIVADO: 'DERIVADO',
}

export const ESTADO_LABEL = {
  CREADO: 'Creado',
  EN_COLA: 'En cola',
  LLAMADO: 'Llamado',
  EN_ATENCION: 'En atención',
  FINALIZADO: 'Finalizado',
  ANULADO: 'Anulado',
  DERIVADO: 'Derivado',
}

// Color Mantine por estado (para badges)
export const ESTADO_COLOR = {
  CREADO: 'gray',
  EN_COLA: 'blue',
  LLAMADO: 'yellow',
  EN_ATENCION: 'teal',
  FINALIZADO: 'green',
  ANULADO: 'red',
  DERIVADO: 'grape',
}

// Transiciones válidas desde cada estado (fuente de verdad del flujo)
export const TRANSICIONES = {
  CREADO: ['EN_COLA', 'ANULADO'],
  EN_COLA: ['LLAMADO', 'ANULADO'],
  LLAMADO: ['EN_ATENCION', 'ANULADO'],
  EN_ATENCION: ['FINALIZADO', 'DERIVADO', 'ANULADO'],
  FINALIZADO: [],
  ANULADO: [],
  DERIVADO: [],
}

export const ESTADOS_ACTIVOS = ['CREADO', 'EN_COLA', 'LLAMADO', 'EN_ATENCION']

// Tipos de ticket del backend (TicketType): NORMAL | PREFERENCIAL
export const PRIORIDADES = {
  NORMAL: 'NORMAL',
  PREFERENCIAL: 'PREFERENCIAL',
}

export const PRIORIDAD_LABEL = {
  NORMAL: 'Normal',
  PREFERENCIAL: 'Preferente',
}
