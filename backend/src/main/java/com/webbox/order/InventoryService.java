package com.webbox.order;

import com.webbox.common.ApiException;
import java.time.LocalDate;
import java.util.Map;
import java.util.function.LongFunction;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** Performs conditional inventory writes. Callers must wrap a complete order in one transaction. */
@Service
public class InventoryService {
  private final JdbcTemplate jdbc;
  public InventoryService(JdbcTemplate jdbc) { this.jdbc=jdbc; }
  public void reserve(LocalDate date, Map<Long,Integer> requested, LongFunction<String> dishName) {
    for (var entry : requested.entrySet()) {
      int changed=jdbc.update("update daily_menus set available_quantity=available_quantity-? where menu_date=? and dish_id=? and available_quantity>=?",entry.getValue(),date,entry.getKey(),entry.getValue());
      if(changed!=1) throw new ApiException(HttpStatus.CONFLICT,"OUT_OF_STOCK","Insufficient stock for "+dishName.apply(entry.getKey())+".");
    }
  }
  public void restore(LocalDate date,long dishId,int quantity) { jdbc.update("update daily_menus set available_quantity=available_quantity+? where menu_date=? and dish_id=?",quantity,date,dishId); }
  public boolean markCancelled(long userId,long orderId) { return jdbc.update("update orders set status='CANCELLED',active_meal_key=null where id=? and user_id=? and status='PENDING'",orderId,userId)==1; }
}
