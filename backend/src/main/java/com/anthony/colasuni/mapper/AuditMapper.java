package com.anthony.colasuni.mapper;

import com.anthony.colasuni.dto.audit.AuditLogResponse;
import com.anthony.colasuni.entity.AuditLog;

public class AuditMapper {

    public static AuditLogResponse toResponse(AuditLog log) {
        if (log == null) return null;
        return AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .performedBy(UserMapper.toSummary(log.getPerformedBy()))
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .ipAddress(log.getIpAddress())
                .host(log.getHost())
                .result(log.getResult())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())

                .build();
    }
}
