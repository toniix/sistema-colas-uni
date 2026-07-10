package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.audit.AuditLogResponse;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.enums.AuditResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditService {

    /**
     * Registra una acción de auditoría usando el usuario autenticado en el contexto de seguridad.
     */
    void logAction(AuditAction action, String entityType, Long entityId,
                   Object oldValue, Object newValue, String description, AuditResult result);

    /**
     * Registra una acción de auditoría con un usuario explícito.
     * Útil en casos donde el contexto de seguridad no tiene el usuario correcto
     * (por ejemplo, en fallos de login o llamadas asíncronas).
     */
    void logAction(AuditAction action, String entityType, Long entityId,
                   Object oldValue, Object newValue, String description,
                   User performedBy, AuditResult result);

    Page<AuditLogResponse> getAuditLogs(Pageable pageable);
}
