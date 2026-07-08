package com.anthony.colasuni.exception;

import org.springframework.http.HttpStatus;

public class DuplicateActiveTicketException extends BusinessException {
    public DuplicateActiveTicketException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
