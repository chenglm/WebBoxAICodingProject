package com.webbox.order;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.webbox.common.ApiException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class InventoryServiceTest {
 @Test void insufficient_second_dish_raises_specific_error_so_outer_order_transaction_rolls_back(){JdbcTemplate jdbc=mock(JdbcTemplate.class);when(jdbc.update(startsWith("update daily_menus set available_quantity=available_quantity-"),any(),any(),any(),any())).thenReturn(1,0);var requested=new LinkedHashMap<Long,Integer>();requested.put(1L,1);requested.put(2L,1);ApiException e=assertThrows(ApiException.class,()->new InventoryService(jdbc).reserve(LocalDate.now(),requested,id->id==2?"Tofu Bowl":"Chicken Bowl"));assertEquals("OUT_OF_STOCK",e.code());assertTrue(e.getMessage().contains("Tofu Bowl"));verify(jdbc,times(2)).update(startsWith("update daily_menus set available_quantity=available_quantity-"),any(),any(),any(),any());}
 @Test void a_failed_conditional_cancel_never_restores_stock(){JdbcTemplate jdbc=mock(JdbcTemplate.class);when(jdbc.update(startsWith("update orders set status='CANCELLED'"),anyLong(),anyLong())).thenReturn(0);var service=new InventoryService(jdbc);assertFalse(service.markCancelled(2,3));verify(jdbc,never()).update(startsWith("update daily_menus set available_quantity=available_quantity+"),any(),any(),any());}
}
