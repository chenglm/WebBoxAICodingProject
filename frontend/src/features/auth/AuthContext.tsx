import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '../../shared/api/types';
import { fetchCurrentUser } from './api';

interface AuthContextValue {
  user: User | null;
  /** True only while the very first session check is in flight. */
  isLoading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading,
      setUser: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
    }),
    [data, isLoading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
