package com.anthony.colasuni.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancellationRequest {

    @NotBlank(message = "El motivo de la anulación es obligatorio.")
    private String observation;
}
