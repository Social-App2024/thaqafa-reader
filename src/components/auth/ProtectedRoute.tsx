import { withAuthenticationRequired } from 'react-oidc-context'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

const Guarded = withAuthenticationRequired(() => <Outlet />, {
  OnRedirecting: () => <RedirectionScreen />,
})

const ProtectedRoute = () => {
  return <Guarded />
}

const RedirectionScreen = () => {
  const { t } = useTranslation('common')

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <div className="text-xl font-poppins">
          {t('routes.auth.protected.redirecting')}
        </div>
      </div>
    </>
  )
}

export default ProtectedRoute
