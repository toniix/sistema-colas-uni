package com.anthony.colasuni.enums;

public enum AuditAction {
    // Acciones de autenticación
    LOGIN,
    LOGIN_FAILED,
    LOGOUT,

    // Acciones de tickets
    CREATE_TICKET,
    CALL,
    FINISH,
    DERIVE,
    CANCEL,

    // Acciones genéricas de CRUD
    UPDATE,
    DELETE,

    // Acciones legacy (conservadas por compatibilidad)
    TICKET_CREATED,
    TICKET_STATUS_CHANGED,
    TICKET_DERIVED,
    TICKET_CANCELLED,
    USER_CREATED,
    USER_UPDATED,
    USER_DELETED
}
