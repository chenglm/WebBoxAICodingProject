package com.webbox.auth;

import com.webbox.common.ApiException;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.webbox.auth.AuthModels.*;

@Service
public class AuthService {
  private final JdbcTemplate jdbc; private final PasswordEncoder encoder;
  public AuthService(JdbcTemplate jdbc, PasswordEncoder encoder) { this.jdbc=jdbc; this.encoder=encoder; }
  @Transactional public UserResponse register(RegisterRequest r) {
    validatePassword(r.password()); String email=r.email().trim().toLowerCase(Locale.ROOT);
    if (jdbc.queryForObject("select count(*) from users where email=?",Integer.class,email)>0) throw new ApiException(HttpStatus.CONFLICT,"EMAIL_EXISTS","An account with this email already exists.");
    jdbc.update("insert into users(email,password_hash,role) values(?,?,?)",email,encoder.encode(r.password()),"EMPLOYEE");
    Long id=jdbc.queryForObject("select id from users where email=?",Long.class,email); jdbc.update("insert into user_preferences(user_id) values(?)",id); return new UserResponse(id,email,"EMPLOYEE");
  }
  public CurrentUser login(LoginRequest r) { var rows=jdbc.query("select id,email,password_hash,role from users where email=?",(rs,n)->new Object[]{rs.getLong(1),rs.getString(2),rs.getString(3),rs.getString(4)},r.email().trim().toLowerCase(Locale.ROOT)); if(rows.isEmpty() || !encoder.matches(r.password(),(String)rows.get(0)[2])) throw new ApiException(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS","Invalid email or password."); Object[] x=rows.get(0); return new CurrentUser((Long)x[0],(String)x[1],(String)x[3]); }
  public static void validatePassword(String password) { if(!password.matches("(?=.*[A-Za-z])(?=.*\\d).{8,}")) throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_PASSWORD","Password must be at least 8 characters and contain both letters and numbers."); }
}
