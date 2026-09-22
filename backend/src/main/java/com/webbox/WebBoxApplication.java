package com.webbox;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication @EnableCaching
public class WebBoxApplication {
  public static void main(String[] args) { SpringApplication.run(WebBoxApplication.class, args); }
  @Bean Clock shanghaiClock() { return Clock.system(ZoneId.of("Asia/Shanghai")); }
}
