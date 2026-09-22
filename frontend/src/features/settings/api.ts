import { apiRequest } from '../../shared/api/http';
import type { Preferences } from '../../shared/api/types';

export function fetchPreferences(): Promise<Preferences> {
  return apiRequest<Preferences>('/me/preferences');
}

export function savePreferences(preferences: Preferences): Promise<Preferences> {
  return apiRequest<Preferences>('/me/preferences', {
    method: 'PUT',
    body: preferences,
  });
}
