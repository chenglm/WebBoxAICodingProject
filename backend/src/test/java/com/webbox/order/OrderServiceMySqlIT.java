package com.webbox.order;

import static org.junit.jupiter.api.Assertions.*;
import com.webbox.common.ApiException;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static com.webbox.order.OrderModels.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.MOCK)
class OrderServiceMySqlIT {
 private static final MySqlIntegrationTestDatabase DATABASE=MySqlIntegrationTestDatabase.fromEnvironment();
 static { DATABASE.assertReachable(); }

 @DynamicPropertySource
 static void properties(DynamicPropertyRegistry registry){
  registry.add("spring.datasource.url",DATABASE::url);
  registry.add("spring.datasource.username",DATABASE::user);
  registry.add("spring.datasource.password",DATABASE::password);
  registry.add("spring.cache.type",()->"none");
  registry.add("spring.data.redis.host",()->"127.0.0.1");
  registry.add("spring.data.redis.port",()->"6379");
  registry.add("app.jwt-secret",()->"mysql-integration-test-secret-that-is-at-least-32-bytes");
 }

 @Autowired private OrderService orders;
 @Autowired private JdbcTemplate jdbc;
 private LocalDate deliveryDate;

 @BeforeEach
 void reset(){
  jdbc.update("delete from idempotency_records");
  jdbc.update("delete from order_item_options");
  jdbc.update("delete from order_items");
  jdbc.update("delete from orders");
  jdbc.update("delete from daily_menus where dish_id >= 10000");
  jdbc.update("delete from dishes where id >= 10000");
  jdbc.update("delete from users where id >= 10000");
  deliveryDate=LocalDate.now(ZoneId.of("Asia/Shanghai")).plusDays(2);
 }

 @Test
 void same_idempotency_key_concurrently_returns_one_order(){
  Fixture fixture=fixture(1,1);
  List<Outcome<OrderView>> outcomes=concurrently(2,()->orders.create(fixture.userIds().get(0),"same-key",request(fixture.dishIds().get(0))));
  assertTrue(outcomes.stream().allMatch(Outcome::succeeded),outcomes.toString());
  assertEquals(outcomes.get(0).value().id(),outcomes.get(1).value().id());
  assertEquals(1,count("select count(*) from orders"));
  assertEquals(0,stock(fixture.dishIds().get(0)));
 }

 @Test
 void concurrent_orders_for_the_same_meal_leave_one_active_order(){
  Fixture fixture=fixture(1,2);
  List<Outcome<OrderView>> outcomes=concurrently(2,()->orders.create(fixture.userIds().get(0),"key-"+Thread.currentThread().getId(),request(fixture.dishIds().get(0))));
  assertEquals(1,outcomes.stream().filter(Outcome::succeeded).count(),outcomes.toString());
  assertEquals(1,count("select count(*) from orders"));
  assertEquals(1,stock(fixture.dishIds().get(0)));
 }

 @Test
 void concurrent_orders_from_different_users_cannot_oversell(){
  Fixture fixture=fixture(2,1);
  List<Outcome<OrderView>> outcomes=concurrently(List.of(
   ()->orders.create(fixture.userIds().get(0),"first-key",request(fixture.dishIds().get(0))),
   ()->orders.create(fixture.userIds().get(1),"second-key",request(fixture.dishIds().get(0)))
  ));
  assertEquals(1,outcomes.stream().filter(Outcome::succeeded).count(),outcomes.toString());
  assertTrue(outcomes.stream().anyMatch(outcome->outcome.error() instanceof ApiException exception&&"OUT_OF_STOCK".equals(exception.code())),outcomes.toString());
  assertEquals(1,count("select count(*) from orders"));
  assertEquals(0,stock(fixture.dishIds().get(0)));
 }

 @Test
 void insufficient_stock_rolls_back_every_deduction_in_the_order(){
  Fixture fixture=fixture(1,2,0);
  ApiException exception=assertThrows(ApiException.class,()->orders.create(fixture.userIds().get(0),"rollback-key",request(fixture.dishIds().get(0),fixture.dishIds().get(1))));
  assertEquals("OUT_OF_STOCK",exception.code());
  assertEquals(2,stock(fixture.dishIds().get(0)));
  assertEquals(0,stock(fixture.dishIds().get(1)));
  assertEquals(0,count("select count(*) from orders"));
 }

 @Test
 void concurrent_repeat_cancellation_restores_stock_once(){
  Fixture fixture=fixture(1,2);
  OrderView created=orders.create(fixture.userIds().get(0),"cancel-key",request(fixture.dishIds().get(0)));
  List<Outcome<OrderView>> outcomes=concurrently(2,()->orders.cancel(fixture.userIds().get(0),created.id()));
  assertEquals(1,outcomes.stream().filter(Outcome::succeeded).count(),outcomes.toString());
  assertTrue(outcomes.stream().anyMatch(outcome->outcome.error() instanceof ApiException exception&&"ORDER_NOT_CANCELLABLE".equals(exception.code())),outcomes.toString());
  assertEquals(2,stock(fixture.dishIds().get(0)));
  assertEquals("CANCELLED",jdbc.queryForObject("select status from orders where id=?",String.class,created.id()));
 }

 private Fixture fixture(int userCount,int... quantities){
  List<Long> userIds=new ArrayList<>(),dishIds=new ArrayList<>();
  for(int i=0;i<userCount;i++)userIds.add(insert("insert into users(id,email,password_hash,role) values(?,?,?,?)",10000L+i,"it-user-"+i+"@example.test","unused","EMPLOYEE"));
  for(int i=0;i<quantities.length;i++){
   long dishId=10000L+i;
   dishIds.add(insert("insert into dishes(id,name,description,category,price_cents,visible) values(?,?,?,?,?,true)",dishId,"Integration Dish "+i,"Transactional fixture","Chinese",1000L));
   jdbc.update("insert into daily_menus(menu_date,dish_id,available_quantity) values(?,?,?)",deliveryDate,dishId,quantities[i]);
  }
  return new Fixture(userIds,dishIds);
 }

 private OrderRequest request(long... dishIds){
  List<OrderLineRequest> items=new ArrayList<>();
  for(long dishId:dishIds)items.add(new OrderLineRequest(dishId,1,List.of()));
  return new OrderRequest(deliveryDate.toString(),"LUNCH",null,"Integration Test Address",items);
 }

 private long insert(String sql,Object... values){
  GeneratedKeyHolder keyHolder=new GeneratedKeyHolder();
  jdbc.update(connection->{
   PreparedStatement statement=connection.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS);
   for(int i=0;i<values.length;i++)statement.setObject(i+1,values[i]);
   return statement;
  },keyHolder);
  Number key=keyHolder.getKey();
  return key==null?(Long)values[0]:key.longValue();
 }

 private int stock(long dishId){return jdbc.queryForObject("select available_quantity from daily_menus where menu_date=? and dish_id=?",Integer.class,deliveryDate,dishId);}
 private int count(String sql){return jdbc.queryForObject(sql,Integer.class);}

 private <T> List<Outcome<T>> concurrently(int tasks,Callable<T> callable){
  List<Callable<T>> callables=new ArrayList<>();
  for(int i=0;i<tasks;i++)callables.add(callable);
  return concurrently(callables);
 }

 private <T> List<Outcome<T>> concurrently(List<Callable<T>> callables){
  ExecutorService executor=Executors.newFixedThreadPool(callables.size());
  try{
   CyclicBarrier barrier=new CyclicBarrier(callables.size());
   List<Future<Outcome<T>>> futures=new ArrayList<>();
   for(Callable<T> callable:callables)futures.add(executor.submit(()->{
    try{barrier.await();return Outcome.success(callable.call());}
    catch(Throwable error){return Outcome.failure(error);}
   }));
   List<Outcome<T>> outcomes=new ArrayList<>();
   for(Future<Outcome<T>> future:futures)outcomes.add(future.get());
   return outcomes;
  }catch(Exception exception){throw new AssertionError("Concurrent test execution failed.",exception);}
  finally{executor.shutdownNow();}
 }

 private record Fixture(List<Long> userIds,List<Long> dishIds) {}
 private record Outcome<T>(T value,Throwable error){
  static <T> Outcome<T> success(T value){return new Outcome<>(value,null);}
  static <T> Outcome<T> failure(Throwable error){return new Outcome<>(null,error);}
  boolean succeeded(){return error==null;}
 }
}
