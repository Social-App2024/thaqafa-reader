import { useEffect } from 'react'
import { userManager } from '../../data/oidc'

/** Iframe target for silent token renewal (`/auth/silent/callback`). */
export default function SilentCallback() {
  useEffect(() => {
    userManager.signinSilentCallback().catch(console.error)
  }, [])

  return <></>
}
