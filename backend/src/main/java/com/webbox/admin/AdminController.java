package com.webbox.admin;

import com.webbox.menu.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.validation.annotation.Validated;
import static com.webbox.menu.MenuModels.*;

@RestController @Validated @RequestMapping("/admin") @PreAuthorize("hasRole('ADMIN')")
public class AdminController { private final MenuService service; public AdminController(MenuService service){this.service=service;}
 @GetMapping("/dishes") public List<Dish> dishes(@RequestParam(required=false) @jakarta.validation.constraints.Size(max=50,message="Search must be 50 characters or fewer.") String q,@RequestParam(required=false) @jakarta.validation.constraints.Size(max=60) String category){return service.adminList(q,category);}
 @PostMapping("/dishes") @ResponseStatus(HttpStatus.CREATED) public Dish create(@Valid @RequestBody DishInput i){return service.create(i);}
 @PutMapping("/dishes/{id}") public Dish update(@PathVariable long id,@Valid @RequestBody DishInput i){return service.update(id,i);}
 @PatchMapping("/dishes/{id}/visibility") public Dish visibility(@PathVariable long id,@RequestParam boolean visible){return service.setVisibility(id,visible);}
 @PostMapping(value="/dishes/{id}/image",consumes="multipart/form-data") public Dish image(@PathVariable long id,@RequestPart MultipartFile file){ if(file.isEmpty()||file.getSize()>5_000_000)throw new com.webbox.common.ApiException(HttpStatus.BAD_REQUEST,"INVALID_IMAGE","Image must be non-empty and no larger than 5 MB."); if(file.getContentType()==null||!file.getContentType().startsWith("image/"))throw new com.webbox.common.ApiException(HttpStatus.BAD_REQUEST,"INVALID_IMAGE","Only image files are supported."); return service.storeImage(id,file); }
 @PostMapping("/daily-menus") @ResponseStatus(HttpStatus.NO_CONTENT) public void daily(@Valid @RequestBody DailyMenuInput input){service.configureDaily(input);}
}
