package com.webbox.order;

import static org.junit.jupiter.api.Assertions.*;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

/** Ensures the MySQL migration, rather than only application checks, carries concurrent-order guarantees. */
class PersistenceGuaranteesTest {
 private String migration() throws Exception {try(InputStream in=getClass().getResourceAsStream("/db/migration/V1__schema_and_seed.sql")){return new String(in.readAllBytes(),StandardCharsets.UTF_8);}}
 @Test void idempotency_key_is_unique_per_user() throws Exception {assertTrue(migration().contains("UNIQUE KEY uq_order_idempotency(user_id,idempotency_key)"));}
 @Test void active_order_is_unique_per_user_and_meal() throws Exception {assertTrue(migration().contains("UNIQUE KEY uq_active_order(user_id,active_meal_key)"));}
 @Test void inventory_is_non_negative_and_has_daily_menu_key() throws Exception {String sql=migration();assertTrue(sql.contains("CHECK(available_quantity >= 0)"));assertTrue(sql.contains("PRIMARY KEY(menu_date,dish_id)"));}
}
