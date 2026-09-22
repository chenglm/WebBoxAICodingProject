package com.webbox.user;

import jakarta.validation.constraints.*;
import java.util.List;
public final class UserModels {
 private UserModels() {}
 public record Preferences(List<String> preferredCategories,String spicePreference,String tastePreference,Long budgetCents,List<String> allergens) {}
 public record Address(Long id,@NotBlank @Size(max=60) String label,@NotBlank @Size(max=200) String address,boolean isDefault) {}
}
