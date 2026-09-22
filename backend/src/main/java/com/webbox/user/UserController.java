package com.webbox.user;

import com.webbox.auth.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import static com.webbox.user.UserModels.*;

@RestController @RequestMapping("/me")
public class UserController {private final UserService service;public UserController(UserService service){this.service=service;}
 @GetMapping("/preferences") public Preferences getPreferences(@AuthenticationPrincipal CurrentUser u){return service.preferences(u.id());}
 @PutMapping("/preferences") public Preferences putPreferences(@AuthenticationPrincipal CurrentUser u,@Valid @RequestBody Preferences p){return service.savePreferences(u.id(),p);}
 @GetMapping("/addresses") public List<Address> addresses(@AuthenticationPrincipal CurrentUser u){return service.addresses(u.id());}
 @PostMapping("/addresses") @ResponseStatus(HttpStatus.CREATED) public Address add(@AuthenticationPrincipal CurrentUser u,@Valid @RequestBody Address a){return service.addAddress(u.id(),a);}
 @PutMapping("/addresses/{id}") public Address edit(@AuthenticationPrincipal CurrentUser u,@PathVariable long id,@Valid @RequestBody Address a){return service.updateAddress(u.id(),id,a);}
 @DeleteMapping("/addresses/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@AuthenticationPrincipal CurrentUser u,@PathVariable long id){service.deleteAddress(u.id(),id);}
}
