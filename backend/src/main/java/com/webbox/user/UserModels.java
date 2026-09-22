package com.webbox.user;

import jakarta.validation.constraints.*;
import java.util.List;
public final class UserModels {
 private UserModels() {}
 public record Preferences(List<@Pattern(regexp="Chinese|Western|Japanese|Light Meal|Korean|Southeast Asian",message="Unsupported category.") String> preferredCategories,@Pattern(regexp="None|Mild|Medium|Hot",message="Unsupported spice preference.") String spicePreference,@Pattern(regexp="Light|Moderate|Rich",message="Unsupported taste preference.") String tastePreference,@PositiveOrZero Long budgetCents,List<@Pattern(regexp="Peanuts|Dairy|Egg|Gluten|Soy|Fish|Shellfish",message="Unsupported allergen.") String> allergens,boolean recommendedEnabled) {}
 public record Address(Long id,@NotBlank @Size(max=60) String label,@NotBlank @Size(max=200) String address,boolean isDefault) {}
}
