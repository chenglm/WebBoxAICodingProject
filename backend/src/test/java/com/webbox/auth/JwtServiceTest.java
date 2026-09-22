package com.webbox.auth;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
 @Test void rejects_a_missing_or_short_signing_secret(){assertThrows(IllegalStateException.class,()->new JwtService("short",60));}
 @Test void signs_and_parses_with_a_secure_secret(){var service=new JwtService("this-is-a-test-secret-with-at-least-32-bytes",60);var parsed=service.parse(service.create(new CurrentUser(1,"admin@webbox.example","ADMIN")));assertEquals(1,parsed.id());assertEquals("ADMIN",parsed.role());}
}
