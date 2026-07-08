package com.anthony.colasuni.dto.service;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest {

    @NotBlank(message = "El nombre del servicio es obligatorio.")
    @Size(max = 100, message = "El nombre del servicio no puede superar los 100 caracteres.")
    private String name;

    @Size(max = 255, message = "La descripción no puede superar los 255 caracteres.")
    private String description;

    @NotBlank(message = "El prefijo es obligatorio.")
    @Size(min = 2, max = 10, message = "El prefijo debe tener entre 2 y 10 caracteres.")
    private String prefix;

    private Long assignedOperatorId; // ID del usuario con rol OPERADOR
}
