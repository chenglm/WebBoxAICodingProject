package com.webbox.order;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import java.lang.reflect.Method;
import java.time.Clock;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;

class IdempotencyReservationTest {
 @Test void duplicate_reservation_returns_the_committed_order_id() throws Exception {
  JdbcTemplate jdbc=mock(JdbcTemplate.class); when(jdbc.update(startsWith("insert into idempotency_records"),any(),any(),any(),any())).thenThrow(new DuplicateKeyException("duplicate"));
  when(jdbc.query(startsWith("select order_id from idempotency_records"),any(org.springframework.jdbc.core.RowMapper.class),anyLong(),anyString())).thenReturn(List.of(42L));
  var service=new OrderService(jdbc,new CutoffPolicy(Clock.systemUTC()),new PricingService(),mock(InventoryService.class)); Method method=OrderService.class.getDeclaredMethod("reserveIdempotencyKey",long.class,String.class);method.setAccessible(true);
  assertEquals(42L,method.invoke(service,2L,"same-key"));
 }
}
