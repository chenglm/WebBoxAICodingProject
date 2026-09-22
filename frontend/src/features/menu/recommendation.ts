import type { Dish, Preferences } from '../../shared/api/types';

/**
 * Client-side recommendation scoring used for highlighting and ordering when
 * "Recommended for me" is enabled. Category match weighs more than an exact
 * spice-level match. (The toggle itself is a client-side preference; the
 * backend preferences payload has no such field yet.)
 */
export function recommendationScore(dish: Dish, preferences: Preferences): number {
  let score = 0;
  if (dish.category && preferences.preferredCategories.includes(dish.category)) {
    score += 2;
  }
  if (preferences.spicePreference && dish.spiceLevel === preferences.spicePreference) {
    score += 1;
  }
  return score;
}

export function isRecommended(dish: Dish, preferences: Preferences): boolean {
  return recommendationScore(dish, preferences) > 0;
}

export function sortByRecommendation(dishes: Dish[], preferences: Preferences): Dish[] {
  return [...dishes].sort((a, b) => recommendationScore(b, preferences) - recommendationScore(a, preferences));
}

/** Allergens of the dish that the employee tracks in preferences. */
export function allergenHits(dish: Dish, preferences: Preferences): string[] {
  return dish.allergens.filter((a) => preferences.allergens.includes(a));
}
