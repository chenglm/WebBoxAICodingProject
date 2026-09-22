package com.webbox.menu;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import static com.webbox.menu.MenuModels.*;

@RestController @Validated @RequestMapping("/menu")
public class MenuController { private final MenuService service; public MenuController(MenuService service){this.service=service;}
 @GetMapping public MenuPage list(@RequestParam(required=false) LocalDate date,@RequestParam(required=false) @Size(max=50,message="Search must be 50 characters or fewer.") String q,@RequestParam(required=false) List<String> categories,@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size){return service.list(date,q,categories,page,size);}
 @GetMapping("/{dishId}") public Dish detail(@PathVariable long dishId,@RequestParam(required=false) LocalDate date){return service.detail(dishId,date);}
 @GetMapping("/{dishId}/image") public org.springframework.http.ResponseEntity<byte[]> image(@PathVariable long dishId){var image=service.image(dishId);if(image==null)throw new com.webbox.common.ApiException(org.springframework.http.HttpStatus.NOT_FOUND,"IMAGE_NOT_FOUND","Image not found.");return org.springframework.http.ResponseEntity.ok().contentType(org.springframework.http.MediaType.parseMediaType(image.contentType())).body(image.bytes());}
}
