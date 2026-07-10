package com.anthony.colasuni.dto.ticket;

import com.anthony.colasuni.enums.TicketPriority;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {

    @NotNull(message = "El ID del servicio es obligatorio.")
    private Long serviceId;

    /**
     * Prioridad del turno. Si no se indica, el servicio asignará NORMAL por defecto.
     */
    private TicketPriority priority;
}
