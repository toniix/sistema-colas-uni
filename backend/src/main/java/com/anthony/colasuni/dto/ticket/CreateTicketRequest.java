package com.anthony.colasuni.dto.ticket;

import com.anthony.colasuni.enums.TicketType;
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

    @NotNull(message = "El tipo de ticket (NORMAL o PREFERENCIAL) es obligatorio.")
    private TicketType type;
}
