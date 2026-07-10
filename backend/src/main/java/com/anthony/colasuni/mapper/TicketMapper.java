package com.anthony.colasuni.mapper;

import com.anthony.colasuni.dto.ticket.TicketResponse;
import com.anthony.colasuni.entity.Ticket;

public class TicketMapper {

    public static TicketResponse toResponse(Ticket ticket) {
        if (ticket == null) return null;
        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .position(ticket.getPosition())
                .student(UserMapper.toSummary(ticket.getStudent()))
                .service(ServiceMapper.toResponse(ticket.getService()))
                .operator(UserMapper.toSummary(ticket.getOperator()))
                .derivedToService(ServiceMapper.toResponse(ticket.getDerivedToService()))
                .derivationReason(ticket.getDerivationReason())
                .cancellationObservation(ticket.getCancellationObservation())
                .attentionObservation(ticket.getAttentionObservation())
                .calledAt(ticket.getCalledAt())
                .attendedAt(ticket.getAttendedAt())
                .finishedAt(ticket.getFinishedAt())
                .createdAt(ticket.getCreatedAt())
                .build();
    }
}
