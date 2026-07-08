package com.anthony.colasuni.dto.ticket;

import com.anthony.colasuni.dto.service.ServiceResponse;
import com.anthony.colasuni.dto.user.UserSummaryDTO;
import com.anthony.colasuni.enums.TicketStatus;
import com.anthony.colasuni.enums.TicketType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketResponse {
    private Long id;
    private String ticketCode;
    private TicketStatus status;
    private TicketType type;
    private Integer position;
    private UserSummaryDTO student;
    private ServiceResponse service;
    private UserSummaryDTO operator;
    private ServiceResponse derivedToService;
    private String derivationReason;
    private String cancellationObservation;
    private String attentionObservation;
    private LocalDateTime calledAt;

    private LocalDateTime attendedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime createdAt;
}
