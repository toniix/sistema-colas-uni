package com.anthony.colasuni.dto.sse;

import com.anthony.colasuni.dto.ticket.QueueStatusResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QueueUpdateEvent {
    private Long serviceId;
    private String eventType; // Ej: "QUEUE_UPDATE", "CALLED", "FINISHED", "CANCELLED", "DERIVED"
    private QueueStatusResponse payload;
}
