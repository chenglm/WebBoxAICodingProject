import { useSyncExternalStore } from 'react';

/**
 * "Recommended for me" toggle state.
 *
 * The backend preferences payload has no field for this flag yet, so it is
 * kept client-side in localStorage and shared across routes through a small
 * external store. Backend gap: persist `recommendedEnabled` per user.
 */

const STORAGE_KEY = 'webox.recommendedEnabled';
const listeners = new Set<() => void>();

export function getRecommendedEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setRecommendedEnabled(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Storage unavailable; the toggle just becomes session-only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRecommendedEnabled(): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribe, getRecommendedEnabled);
  return [value, setRecommendedEnabled];
}
