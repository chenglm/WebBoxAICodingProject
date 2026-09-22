package com.webbox.config;

import com.webbox.auth.JwtService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

@Configuration @EnableMethodSecurity
public class SecurityConfig {
  @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
  @Bean SecurityFilterChain security(HttpSecurity http, JwtService jwt) throws Exception { return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).exceptionHandling(e->e.authenticationEntryPoint((req,res,x)->jsonError(res,401,"UNAUTHORIZED","Authentication is required.")).accessDeniedHandler((req,res,x)->jsonError(res,403,"FORBIDDEN","You do not have permission to perform this action."))).authorizeHttpRequests(a->a.requestMatchers("/auth/register","/auth/login","/v3/api-docs/**","/swagger-ui/**").permitAll().anyRequest().authenticated()).addFilterBefore(new JwtCookieFilter(jwt), UsernamePasswordAuthenticationFilter.class).build(); }
  private static void jsonError(HttpServletResponse response,int status,String code,String message) throws IOException { response.setStatus(status);response.setContentType("application/json");response.getWriter().write("{\"code\":\""+code+"\",\"message\":\""+message+"\"}"); }
  @Bean CorsConfigurationSource corsConfigurationSource() { CorsConfiguration c=new CorsConfiguration(); c.setAllowedOrigins(List.of("http://localhost:5173")); c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS")); c.setAllowedHeaders(List.of("Content-Type","Idempotency-Key")); c.setAllowCredentials(true); UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource(); s.registerCorsConfiguration("/**",c); return s; }
  static class JwtCookieFilter extends org.springframework.web.filter.OncePerRequestFilter { private final JwtService jwt; JwtCookieFilter(JwtService jwt){this.jwt=jwt;} @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException { if(req.getCookies()!=null) for(Cookie c:req.getCookies()) if("webbox_token".equals(c.getName())) try { var u=jwt.parse(c.getValue()); SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(u,null,u.getAuthorities())); } catch(Exception ignored) {} chain.doFilter(req,res); } }
}
