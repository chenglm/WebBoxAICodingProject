package com.webbox.auth;

import jakarta.validation.constraints.*;
import java.util.List;

public final class AuthModels {
  private AuthModels() {}
  public record RegisterRequest(@NotBlank @Email @Size(max=200) String email, @NotBlank @Size(min=8,max=100) String password) {}
  public record LoginRequest(@NotBlank @Email @Size(max=200) String email, @NotBlank @Size(max=100) String password) {}
  public record UserResponse(long id, String email, String role) {}
}
