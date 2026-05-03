package com.example.event_management.security.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNAUTHORIZED) // Trả về 401
public class AuthException extends RuntimeException {
    public AuthException(String message) {
        super(message);
    }
}
