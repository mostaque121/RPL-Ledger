import { Navigate, Outlet, useLocation } from 'react-router'
import { FullScreenLoader } from '@/components/feedback/FullScreenLoader'
import { useAuth } from './auth-context'

/** Renders child routes only when signed in; otherwise sends the user to /login. */
export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
