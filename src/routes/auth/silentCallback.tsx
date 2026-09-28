import { useEffect } from 'react'
import { userManager } from '../../data/oidc'

export default function SilentLoginCallback() {
  useEffect(() => {
    ; (async () => {
      await userManager.signinSilentCallback().catch(console.error)
    })()
  }, [])
  return <></>
}
