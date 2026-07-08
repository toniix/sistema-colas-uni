package com.anthony.colasuni.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DerivationRequest {

    @NotNull(message = "El ID del servicio de destino es obligatorio.")
    private Long targetServiceId;

    @NotBlank(message = "El motivo de la derivación es obligatorio.")
    private String reason;
}
