import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from './AppLayout';

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-agri-600 border-t-transparent" />
    </div>
  );
}

/** Requires an authenticated session; renders the app shell around nested routes. */
export function ProtectedRoute() {
  const { user, bootstrapping } = useAuth();
  if (bootstrapping) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

/** For /login — bounce already-authenticated users to the dashboard. */
export function PublicOnlyRoute({ children }: { children?: ReactNode }) {
  const { user, bootstrapping } = useAuth();
  if (bootstrapping) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return children ? <>{children}</> : <Outlet />;
}
