import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userManager } from '../../data/oidc'

/** `/logout` — ends the Auth0 session, then lands on `/logout/callback`. */
export default function Logout() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    const startLogout = async () => {
      const user = await userManager.getUser()
      if (!user) {
        navigate('/', { replace: true })
        return
      }
      await userManager.signoutRedirect()
    }

    startLogout()
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
