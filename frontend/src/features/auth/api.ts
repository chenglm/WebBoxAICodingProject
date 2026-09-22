import { apiRequest, ApiError } from '../../shared/api/http';
import type { User } from '../../shared/api/types';

/** Returns the current user, or null when the session cookie is absent/expired. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await apiRequest<User>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function login(email: string, password: string): Promise<User> {
  return apiRequest<User>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function register(email: string, password: string): Promise<User> {
  return apiRequest<User>('/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}
