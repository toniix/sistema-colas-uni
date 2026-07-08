package com.anthony.colasuni.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedOperationException extends BusinessException {
    public UnauthorizedOperationException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
