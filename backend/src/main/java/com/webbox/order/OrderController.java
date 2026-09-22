package com.webbox.order;

import com.webbox.auth.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import static com.webbox.order.OrderModels.*;

@RestController @RequestMapping("/orders")
public class OrderController {private final OrderService service;public OrderController(OrderService service){this.service=service;}
 @GetMapping("/suggestion") public OrderSuggestion suggestion(){return service.suggestion();}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public OrderView create(@AuthenticationPrincipal CurrentUser u,@RequestHeader(name="Idempotency-Key",required=false) String key,@Valid @RequestBody OrderRequest r){return service.create(u.id(),key,r);}
 @GetMapping public List<OrderView> list(@AuthenticationPrincipal CurrentUser u){return service.list(u.id());}
 @GetMapping("/{id}") public OrderView get(@AuthenticationPrincipal CurrentUser u,@PathVariable long id){return service.detail(u.id(),id);}
 @PostMapping("/{id}/cancel") public OrderView cancel(@AuthenticationPrincipal CurrentUser u,@PathVariable long id){return service.cancel(u.id(),id);}
}
