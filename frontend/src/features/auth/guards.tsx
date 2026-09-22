import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button, Result } from 'antd';
import { copy } from '../../shared/copy/en';
import { LoadingView } from '../../shared/ui/StateViews';
import { useAuth } from './AuthContext';

/** Requires any authenticated session; redirects to /login otherwise. */
export function RequireAuth({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingView />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

/** Requires an ADMIN session; employees see an English 403 state. */
export function RequireAdmin({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingView />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user.role !== 'ADMIN') {
    return (
      <Result
        status="403"
        title={copy.guard.forbiddenTitle}
        subTitle={copy.guard.forbiddenBody}
        extra={
          <Button type="primary" href="/menu">
            {copy.guard.backToMenu}
          </Button>
        }
      />
    );
  }
  return children;
}
