package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.audit.AuditLogResponse;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditService {

    void logAction(AuditAction action, String entityType, Long entityId, Object oldValue, Object newValue, String description, com.anthony.colasuni.enums.AuditResult result);

    void logAction(AuditAction action, String entityType, Long entityId, Object oldValue, Object newValue, String description, User performedBy, com.anthony.colasuni.enums.AuditResult result);


    Page<AuditLogResponse> getAuditLogs(Pageable pageable);
}
