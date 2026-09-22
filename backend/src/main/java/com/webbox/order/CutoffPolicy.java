package com.webbox.order;

import com.webbox.common.ApiException;
import java.time.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import static com.webbox.order.OrderModels.OrderSuggestion;

@Component
public class CutoffPolicy {
 private final Clock clock; public CutoffPolicy(Clock clock){this.clock=clock;}
 public OrderSuggestion suggestion(){LocalDateTime now=LocalDateTime.now(clock);LocalTime t=now.toLocalTime();if(t.isBefore(LocalTime.of(10,0)))return new OrderSuggestion(now.toLocalDate().toString(),"LUNCH");if(t.isBefore(LocalTime.of(15,0)))return new OrderSuggestion(now.toLocalDate().toString(),"DINNER");return new OrderSuggestion(now.toLocalDate().plusDays(1).toString(),"LUNCH");}
 public void validate(LocalDate date,String meal){LocalDateTime now=LocalDateTime.now(clock); if(date.isBefore(now.toLocalDate()))throw new ApiException(HttpStatus.BAD_REQUEST,"ORDER_CLOSED","This delivery date is no longer available."); if(date.equals(now.toLocalDate())){if("LUNCH".equals(meal)&&!now.toLocalTime().isBefore(LocalTime.of(10,0)))throw new ApiException(HttpStatus.BAD_REQUEST,"ORDER_CLOSED","Lunch orders close at 10:00 Asia/Shanghai time.");if("DINNER".equals(meal)&&!now.toLocalTime().isBefore(LocalTime.of(15,0)))throw new ApiException(HttpStatus.BAD_REQUEST,"ORDER_CLOSED","Dinner orders close at 15:00 Asia/Shanghai time.");}}
}
