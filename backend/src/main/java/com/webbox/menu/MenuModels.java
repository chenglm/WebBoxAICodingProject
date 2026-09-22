package com.webbox.menu;

import java.util.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
public final class MenuModels {
 private MenuModels() {}
 public record OptionItem(long id,String name,long extraPriceCents) implements java.io.Serializable {}
 public record OptionGroup(long id,String name,boolean required,int minSelections,int maxSelections,List<OptionItem> items) implements java.io.Serializable {}
 public record Dish(long id,String name,String description,String category,String protein,String spiceLevel,long priceCents,String imageUrl,boolean visible,List<String> allergens,List<OptionGroup> optionGroups,Integer availableQuantity) implements java.io.Serializable {}
 public record MenuPage(List<Dish> items,long total,int page,int size,String menuDate) {}
 public record DailyMenuResponse(String menuDate,List<Dish> items) {}
 public record DishInput(@NotBlank @Size(max=120) String name,@NotBlank @Size(max=1000) String description,@NotBlank @Pattern(regexp="Chinese|Western|Japanese|Light Meal|Korean|Southeast Asian",message="Unsupported category.") String category,@Size(max=60) String protein,@Pattern(regexp="None|Mild|Medium|Hot",message="Unsupported spice level.") String spiceLevel,@NotNull @PositiveOrZero Long priceCents,@Size(max=500) String imageUrl,Boolean visible,List<@Pattern(regexp="Peanuts|Dairy|Egg|Gluten|Soy|Fish|Shellfish",message="Unsupported allergen.") String> allergens,List<@Valid OptionGroupInput> optionGroups) {}
 public record OptionGroupInput(@NotBlank @Size(max=100) String name,Boolean required,@PositiveOrZero Integer minSelections,@Positive @Max(10) Integer maxSelections,List<@Valid OptionItemInput> items) {}
 public record OptionItemInput(@NotBlank @Size(max=100) String name,@PositiveOrZero Long extraPriceCents) {}
 public record DailyMenuInput(@NotBlank @Pattern(regexp="\\d{4}-\\d{2}-\\d{2}",message="menuDate must use YYYY-MM-DD format.") String menuDate,@NotEmpty List<@Valid DailyMenuDishInput> dishes) {}
 public record DailyMenuDishInput(@Positive long dishId,@PositiveOrZero int availableQuantity) {}
}
