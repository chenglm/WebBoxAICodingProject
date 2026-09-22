package com.webbox.auth;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import static com.webbox.auth.AuthModels.*;

@RestController @RequestMapping("/auth")
public class AuthController {
  private final AuthService service; private final JwtService jwt; private final boolean secure;
  public AuthController(AuthService service, JwtService jwt, @org.springframework.beans.factory.annotation.Value("${app.cookie-secure}") boolean secure) { this.service=service; this.jwt=jwt; this.secure=secure; }
  @PostMapping("/register") public UserResponse register(@Valid @RequestBody RegisterRequest r) { return service.register(r); }
  @PostMapping("/login") public UserResponse login(@Valid @RequestBody LoginRequest r, HttpServletResponse response) { CurrentUser u=service.login(r); set(response,jwt.create(u),jwt.ttl()); return new UserResponse(u.id(),u.email(),u.role()); }
  @PostMapping("/logout") public void logout(HttpServletResponse response) { set(response,"",0); }
  @GetMapping("/me") public UserResponse me(@AuthenticationPrincipal CurrentUser u) { return new UserResponse(u.id(),u.email(),u.role()); }
  private void set(HttpServletResponse r,String value,long age) { r.addHeader("Set-Cookie",ResponseCookie.from("webbox_token",value).httpOnly(true).secure(secure).sameSite("Lax").path("/").maxAge(Duration.ofSeconds(age)).build().toString()); }
}
