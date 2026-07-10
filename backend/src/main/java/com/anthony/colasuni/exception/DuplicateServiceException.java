package com.anthony.colasuni.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción lanzada cuando se intenta crear un servicio con un nombre
 * o prefijo que ya existe en el sistema.
 */
public class DuplicateServiceException extends BusinessException {
    public DuplicateServiceException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
