package com.anthony.colasuni.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción lanzada cuando se intenta llamar el siguiente turno
 * pero el operador ya tiene un turno en estado IN_ATTENTION.
 */
public class OperatorBusyException extends BusinessException {
    public OperatorBusyException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
