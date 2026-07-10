package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.audit.AuditLogResponse;
import com.anthony.colasuni.entity.AuditLog;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.enums.AuditResult;
import com.anthony.colasuni.mapper.AuditMapper;
import com.anthony.colasuni.repository.AuditLogRepository;
import com.anthony.colasuni.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(AuditAction action, String entityType, Long entityId,
                          Object oldValue, Object newValue, String description, AuditResult result) {
        User currentUser = getCurrentUser();
        logAction(action, entityType, entityId, oldValue, newValue, description, currentUser, result);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(AuditAction action, String entityType, Long entityId,
                          Object oldValue, Object newValue, String description,
                          User performedBy, AuditResult result) {
        try {
            String oldValueStr = serialize(oldValue);
            String newValueStr = serialize(newValue);

            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .performedBy(performedBy)
                    .oldValue(oldValueStr)
                    .newValue(newValueStr)
                    .ipAddress(getClientIp())
                    .result(result)
                    .description(description)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Error al registrar bitácora de auditoría", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable).map(AuditMapper::toResponse);
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers privados
    // ──────────────────────────────────────────────────────────────

    private String serialize(Object value) {
        if (value == null) return null;
        if (value instanceof String s) return s;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return value.toString();
        }
    }

    /**
     * Obtiene la IP del cliente HTTP de forma automática desde HttpServletRequest.
     * Considera cabeceras de proxy (X-Forwarded-For).
     */
    private String getClientIp() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                } else {
                    // Si hay múltiples IPs (cadena de proxies) tomar la primera
                    int index = ip.indexOf(',');
                    if (index != -1) {
                        ip = ip.substring(0, index).trim();
                    }
                }
                return ip;
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener la IP del cliente en auditoría", e);
        }
        return "127.0.0.1";
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !"anonymousUser".equals(authentication.getPrincipal())) {
            String username = authentication.getName();
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }
}
