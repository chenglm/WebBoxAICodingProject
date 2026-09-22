package com.webbox.user;

import jakarta.validation.constraints.*;
import java.util.List;
public final class UserModels {
 private UserModels() {}
 public record Preferences(List<@Pattern(regexp="Chinese|Japanese|Vegetarian|Western|Korean",message="Unsupported category.") String> preferredCategories,@Pattern(regexp="None|Mild|Medium|Hot",message="Unsupported spice preference.") String spicePreference,@Pattern(regexp="Savory|Sweet|Sour|Spicy|Umami",message="Unsupported taste preference.") String tastePreference,@PositiveOrZero Long budgetCents,List<@Pattern(regexp="Peanuts|Soy|Fish|Gluten|Dairy|Egg",message="Unsupported allergen.") String> allergens) {}
 public record Address(Long id,@NotBlank @Size(max=60) String label,@NotBlank @Size(max=200) String address,boolean isDefault) {}
}
