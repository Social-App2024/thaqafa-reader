import { useEffect, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router'
import { authCallback } from '../../api/auth'
import SplashScreen from '../../components/Splash'
import queryClient from '../../queries/queryClient'
import { UserProfileQueryKey } from '../../queries/profile'

export default function AuthCallback() {
  const auth = useAuth()
  const requestSent = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.isAuthenticated) return
    if (requestSent.current) return

    requestSent.current = true
      ; (async () => {
        try {
          //TODO: Add some null checking later :]
          const response = await authCallback(auth.user!.profile.email!)

          if (!response) {
            throw new Error('Undefined callback response.')
          }

          queryClient.setQueryData(
            UserProfileQueryKey(auth.user?.profile.sub),
            response.data,
          )

          if (!response.data.onboarded || response.data?.onboarded === false) {
            navigate('/onboarding', { replace: true })
            return
          }
          navigate('/', { replace: true })
        } catch (e) {
          navigate('/error', { replace: true })
        }
      })()
  }, [auth, auth.isAuthenticated])

  return <SplashScreen />
}
