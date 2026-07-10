package com.anthony.colasuni.dto.audit;

import com.anthony.colasuni.dto.user.UserSummaryDTO;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.enums.AuditResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {
    private Long id;
    private AuditAction action;
    private String entityType;
    private Long entityId;
    private UserSummaryDTO performedBy;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private AuditResult result;
    private String description;
    private LocalDateTime createdAt;
}
