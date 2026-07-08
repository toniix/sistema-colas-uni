package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.audit.AuditLogResponse;
import com.anthony.colasuni.entity.AuditLog;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(AuditAction action, String entityType, Long entityId, Object oldValue, Object newValue, String description, com.anthony.colasuni.enums.AuditResult result) {
        User currentUser = getCurrentUser();
        logAction(action, entityType, entityId, oldValue, newValue, description, currentUser, result);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(AuditAction action, String entityType, Long entityId, Object oldValue, Object newValue, String description, User performedBy, com.anthony.colasuni.enums.AuditResult result) {
        try {
            String oldValueStr = oldValue != null ? (oldValue instanceof String ? (String) oldValue : objectMapper.writeValueAsString(oldValue)) : null;
            String newValueStr = newValue != null ? (newValue instanceof String ? (String) newValue : objectMapper.writeValueAsString(newValue)) : null;

            String[] ipAndHost = getClientIpAndHost();

            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .performedBy(performedBy)
                    .oldValue(oldValueStr)
                    .newValue(newValueStr)
                    .ipAddress(ipAndHost[0])
                    .host(ipAndHost[1])
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

    private String[] getClientIpAndHost() {
        String ipAddress = "127.0.0.1";
        String host = "localhost";
        try {
            org.springframework.web.context.request.RequestAttributes attributes = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes instanceof org.springframework.web.context.request.ServletRequestAttributes servletAttributes) {
                jakarta.servlet.http.HttpServletRequest request = servletAttributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                } else {
                    int index = ip.indexOf(',');
                    if (index != -1) {
                        ip = ip.substring(0, index).trim();
                    }
                }
                ipAddress = ip;
                host = request.getRemoteHost();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener la IP y Host del cliente HTTP en auditoría", e);
        }
        return new String[]{ipAddress, host};
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
