package com.webbox.order;

import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import org.junit.jupiter.api.Test;

class CutoffPolicyTest {
 private CutoffPolicy at(String time){return new CutoffPolicy(Clock.fixed(LocalDateTime.parse("2026-09-22T"+time).atZone(ZoneId.of("Asia/Shanghai")).toInstant(),ZoneId.of("Asia/Shanghai")));}
 @Test void switches_lunch_to_dinner_at_ten(){assertEquals("DINNER",at("10:00:00").suggestion().mealPeriod());}
 @Test void switches_to_next_day_lunch_at_fifteen(){var s=at("15:00:00").suggestion();assertEquals("2026-09-23",s.deliveryDate());assertEquals("LUNCH",s.mealPeriod());}
 @Test void refuses_late_same_day_lunch(){assertThrows(RuntimeException.class,()->at("10:00:00").validate(LocalDate.of(2026,9,22),"LUNCH"));}
 @Test void resolves_a_late_lunch_request_to_same_day_dinner(){var resolved=at("10:00:00").resolve(LocalDate.of(2026,9,22),"LUNCH");assertEquals("2026-09-22",resolved.deliveryDate());assertEquals("DINNER",resolved.mealPeriod());}
 @Test void resolves_a_late_dinner_request_to_next_day_lunch(){var resolved=at("15:00:00").resolve(LocalDate.of(2026,9,22),"DINNER");assertEquals("2026-09-23",resolved.deliveryDate());assertEquals("LUNCH",resolved.mealPeriod());}
}
