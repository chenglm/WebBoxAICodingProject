package com.webbox.auth;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class CurrentUserAuthorizationTest {
 @Test void employee_does_not_receive_admin_authority(){var employee=new CurrentUser(2,"employee@webbox.example","EMPLOYEE");assertTrue(employee.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_ADMIN")));}
 @Test void administrator_receives_admin_authority(){assertTrue(new CurrentUser(1,"admin@webbox.example","ADMIN").getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN")));}
}
