package com.webbox.auth;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record CurrentUser(long id, String email, String role) implements UserDetails {
  @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority("ROLE_" + role)); }
  @Override public String getPassword() { return ""; }
  @Override public String getUsername() { return email; }
}
