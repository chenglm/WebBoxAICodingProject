package com.webbox.admin;

import com.webbox.auth.*;
import com.webbox.config.SecurityConfig;
import com.webbox.menu.MenuService;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
class AdminAuthorizationMvcTest {
 @Autowired MockMvc mvc;
 @MockBean MenuService menuService;
 @MockBean JwtService jwtService;
 @Test void unauthenticated_request_gets_json_unauthorized() throws Exception {mvc.perform(get("/admin/dishes")).andExpect(status().isUnauthorized());}
 @Test void employee_is_forbidden_from_admin_dishes() throws Exception {var employee=new CurrentUser(2,"employee@webbox.example","EMPLOYEE");mvc.perform(get("/admin/dishes").with(authentication(new UsernamePasswordAuthenticationToken(employee,null,employee.getAuthorities())))).andExpect(status().isForbidden());}
}
