package com.webbox.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key; private final long ttl;
  public JwtService(@Value("${app.jwt-secret}") String secret, @Value("${app.jwt-ttl-seconds}") long ttl) { this.key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.ttl=ttl; }
  public String create(CurrentUser user) { Instant now=Instant.now(); return Jwts.builder().subject(Long.toString(user.id())).claim("email",user.email()).claim("role",user.role()).issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(ttl))).signWith(key).compact(); }
  public CurrentUser parse(String token) { var c=Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); return new CurrentUser(Long.parseLong(c.getSubject()),c.get("email",String.class),c.get("role",String.class)); }
  public long ttl() { return ttl; }
}
