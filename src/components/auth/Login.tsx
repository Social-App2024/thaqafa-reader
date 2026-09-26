import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userManager } from '../../data/oidc'

/** `/login` — sends the user to Auth0 (already signed in? straight home). */
export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    const startLogin = async () => {
      const user = await userManager.getUser()
      if (user && !user.expired) {
        navigate('/', { replace: true })
        return
      }
      await userManager.signinRedirect({ state: { returnTo: '/' } })
    }

    startLogin()
    // Run once on mount — this page only redirects
  }, [])

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-lg font-poppins text-stone-600">
        {t('auth.redirecting')}
      </div>
    </div>
  )
}
