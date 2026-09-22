package com.webbox.common;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);
  @ExceptionHandler(ApiException.class) ResponseEntity<?> api(ApiException e) { return ResponseEntity.status(e.status()).body(Map.of("code",e.code(),"message",e.getMessage())); }
  @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e) { String m=e.getBindingResult().getFieldErrors().stream().findFirst().map(x->x.getDefaultMessage()).orElse("Invalid request."); return ResponseEntity.badRequest().body(Map.of("code","VALIDATION_ERROR","message",m)); }
  @ExceptionHandler({HandlerMethodValidationException.class, ConstraintViolationException.class}) ResponseEntity<?> parameterValidation(Exception e) { return ResponseEntity.badRequest().body(Map.of("code","VALIDATION_ERROR","message","One or more request parameters are invalid.")); }
  @ExceptionHandler(AccessDeniedException.class) ResponseEntity<?> forbidden() { return ResponseEntity.status(403).body(Map.of("code","FORBIDDEN","message","You do not have permission to perform this action.")); }
  @ExceptionHandler(DataIntegrityViolationException.class) ResponseEntity<?> conflict() { return ResponseEntity.status(409).body(Map.of("code","CONFLICT","message","The requested operation conflicts with existing data.")); }
  @ExceptionHandler(Exception.class) ResponseEntity<?> generic(Exception e, HttpServletRequest r) { log.error("Unhandled request error for {}", r.getRequestURI(), e); return ResponseEntity.status(500).body(Map.of("code","INTERNAL_ERROR","message","An unexpected error occurred.")); }
}
