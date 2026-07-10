package com.anthony.colasuni.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción lanzada cuando se intenta registrar un usuario con un
 * nombre de usuario (username) o correo electrónico ya existente.
 */
public class DuplicateUsernameException extends BusinessException {
    public DuplicateUsernameException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
