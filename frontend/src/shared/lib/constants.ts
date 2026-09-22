/** Business constants shared across features. */

export const MAX_TOTAL_PORTIONS = 5;
export const MAX_SEARCH_LENGTH = 50;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 200;

/**
 * Allergen catalog. Values must match the strings used by backend dish and
 * preference data (seeded in English). Kept as display strings because the
 * API contract exchanges allergen names directly.
 */
export const ALLERGEN_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Wheat (Gluten)',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
] as const;

export const SPICE_LEVELS = ['NONE', 'MILD', 'MEDIUM', 'HOT'] as const;
export type SpiceLevel = (typeof SPICE_LEVELS)[number];

export const TASTE_OPTIONS = ['LIGHT', 'REGULAR', 'RICH'] as const;
export type TastePreference = (typeof TASTE_OPTIONS)[number];

export const PROTEIN_OPTIONS = [
  'Chicken',
  'Beef',
  'Pork',
  'Fish',
  'Shrimp',
  'Tofu',
  'Egg',
  'Mixed',
  'Vegetable',
] as const;
