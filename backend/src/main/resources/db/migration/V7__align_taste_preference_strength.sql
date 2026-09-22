UPDATE user_preferences
SET taste_preference = 'Moderate'
WHERE taste_preference IS NOT NULL
  AND taste_preference NOT IN ('Light', 'Moderate', 'Rich');
