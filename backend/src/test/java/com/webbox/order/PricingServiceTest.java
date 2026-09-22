package com.webbox.order;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import org.junit.jupiter.api.Test;

class PricingServiceTest {
  private final PricingService pricing=new PricingService();
  @Test void adds_options_before_multiplying_in_cents(){ assertEquals(5800,pricing.price(2600,2,List.of(200L,100L))); }
  @Test void rejects_invalid_quantity(){ assertThrows(RuntimeException.class,()->pricing.price(100,6,List.of())); }
}
