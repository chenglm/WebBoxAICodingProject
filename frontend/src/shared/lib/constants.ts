/** Business constants shared across features. */

export const MAX_TOTAL_PORTIONS = 5;
export const MAX_SEARCH_LENGTH = 50;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 200;

/**
 * Server-side vocabularies (Bean Validation on /me/preferences, verified
 * against the running backend). Values are exchanged verbatim with the API.
 */
export const ALLERGEN_OPTIONS = [
  'Peanuts',
  'Dairy',
  'Egg',
  'Gluten',
  'Soy',
  'Fish',
  'Shellfish',
] as const;

export const SPICE_LEVELS = ['None', 'Mild', 'Medium', 'Hot'] as const;
export type SpiceLevel = (typeof SPICE_LEVELS)[number];

export const TASTE_OPTIONS = ['Savory', 'Sweet', 'Sour', 'Spicy', 'Umami'] as const;
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
