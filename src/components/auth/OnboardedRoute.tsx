import { Navigate, Outlet } from 'react-router'
import { useUserProfile } from '../../queries/profile'

const OnboardedRoute = () => {
  const { data: user } = useUserProfile()

  if (!user?.onboarded) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export default OnboardedRoute
