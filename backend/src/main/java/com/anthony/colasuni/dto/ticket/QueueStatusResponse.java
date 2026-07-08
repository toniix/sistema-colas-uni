package com.anthony.colasuni.dto.ticket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueStatusResponse {
    private Long serviceId;
    private String serviceName;
    private String servicePrefix;
    private TicketResponse currentTicket; // Ticket siendo atendido o llamado ahora
    private long queueSize;               // Cantidad de personas esperando en cola
    private int estimatedWaitMinutes;     // Tiempo estimado (ej: 5 min por persona)
}
