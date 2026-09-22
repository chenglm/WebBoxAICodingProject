package com.webbox.menu;

import java.util.*;
public final class MenuModels {
 private MenuModels() {}
 public record OptionItem(long id,String name,long extraPriceCents) implements java.io.Serializable {}
 public record OptionGroup(long id,String name,boolean required,int minSelections,int maxSelections,List<OptionItem> items) implements java.io.Serializable {}
 public record Dish(long id,String name,String description,String category,String protein,String spiceLevel,long priceCents,String imageUrl,boolean visible,List<String> allergens,List<OptionGroup> optionGroups,Integer availableQuantity) implements java.io.Serializable {}
 public record MenuPage(List<Dish> items,long total,int page,int size,String menuDate) {}
 public record DishInput(String name,String description,String category,String protein,String spiceLevel,Long priceCents,String imageUrl,Boolean visible,List<String> allergens,List<OptionGroupInput> optionGroups) {}
 public record OptionGroupInput(String name,Boolean required,Integer minSelections,Integer maxSelections,List<OptionItemInput> items) {}
 public record OptionItemInput(String name,Long extraPriceCents) {}
 public record DailyMenuInput(String menuDate,List<DailyMenuDishInput> dishes) {}
 public record DailyMenuDishInput(long dishId,int availableQuantity) {}
}
