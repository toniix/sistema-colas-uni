package com.anthony.colasuni.dto.service;

import com.anthony.colasuni.dto.user.UserSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceResponse {
    private Long id;
    private String name;
    private String description;
    private String prefix;
    private Long ticketSequence;
    private boolean active;
    private UserSummaryDTO assignedOperator;
    private LocalDateTime createdAt;
}
