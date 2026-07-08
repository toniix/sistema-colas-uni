package com.anthony.colasuni.exception;

import org.springframework.http.HttpStatus;

public class InvalidStateTransitionException extends BusinessException {
    public InvalidStateTransitionException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
