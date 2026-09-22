package com.webbox.order;

import jakarta.validation.constraints.*;
import java.util.List;
public final class OrderModels {
 private OrderModels() {}
 public record OrderRequest(String deliveryDate,String mealPeriod,Long addressId,@Size(max=200,message="Address must be 200 characters or fewer.") String deliveryAddress,@NotEmpty List<OrderLineRequest> items) {}
 public record OrderLineRequest(long dishId,@Min(value=1,message="Quantity must be at least 1.") @Max(value=5,message="Quantity cannot exceed 5.") int quantity,List<Long> optionItemIds) {}
 public record OrderOption(long optionItemId,String name,long extraPriceCents) {}
 public record OrderItem(long dishId,String dishName,long unitPriceCents,int quantity,long subtotalCents,List<OrderOption> options) {}
 public record OrderView(long id,String orderNumber,String deliveryDate,String mealPeriod,String status,String addressSnapshot,long totalCents,List<OrderItem> items) {}
 public record OrderSuggestion(String deliveryDate,String mealPeriod) {}
}
