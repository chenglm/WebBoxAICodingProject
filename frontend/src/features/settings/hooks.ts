import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Preferences } from '../../shared/api/types';
import { fetchPreferences, savePreferences } from './api';

export const PREFERENCES_QUERY_KEY = ['preferences'] as const;

export function usePreferences() {
  return useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: fetchPreferences,
    retry: false,
  });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePreferences,
    onSuccess: (saved) => {
      queryClient.setQueryData(PREFERENCES_QUERY_KEY, saved);
    },
  });
}

export const DEFAULT_PREFERENCES: Preferences = {
  preferredCategories: [],
  spicePreference: null,
  tastePreference: null,
  budgetCents: null,
  allergens: [],
};
