import { useEffect } from 'react'
import { userManager } from '../../data/oidc'

/** Landing route after Auth0 logout (`/logout/callback`). */
export default function LogoutCallback() {
  useEffect(() => {
    userManager
      .signoutRedirectCallback()
      .then(() => window.location.replace('/'))
      .catch(console.error)
  }, [])

  return <></>
}
