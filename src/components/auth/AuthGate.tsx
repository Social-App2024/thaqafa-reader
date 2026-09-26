import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SSO_RETURN_KEY, userManager } from '../../data/oidc'

// StrictMode mounts this gate twice per page load; the probe redirect must
// fire only once, so the guard lives at module scope.
let ssoProbeStarted = false

/**
 * Boot gate, mirroring Thaqafa-Frontend's AppInitializer: before the app
 * renders, restore the session so a user already logged into Thaqafa-Frontend
 * is logged in here too — one Auth0 SSO session, two apps. Tried in order:
 *
 *  1. `signinSilent()` — hidden-iframe `prompt=none`. Fast path, but only
 *     where the Auth0 session cookie is readable inside a cross-site iframe
 *     (Chrome by default; not Safari under ITP).
 *  2. A top-level `prompt=none` redirect probe — a first-party navigation to
 *     Auth0 always carries the session cookie, so this works on Safari too.
 *     Auth0 answers with a code (seamless login) or `error=login_required`,
 *     which AuthCallback turns into a trip back to the page the probe
 *     started from.
 *
 * If neither yields a session the app simply continues unauthenticated
 * (demo/offline fallback).
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const restoreSession = async () => {
      const params = new URLSearchParams(window.location.search)
      // AuthProvider is already exchanging the code or consuming the error
      // from a redirect — don't race it
      const handlingRedirect =
        (params.has('code') || params.has('error')) && params.has('state')
      // We are the silent-renew iframe — never start a nested silent sign-in
      const inIframe = window.self !== window.top
      if (handlingRedirect || inIframe) {
        setReady(true)
        return
      }

      // Read storage directly: this effect runs before AuthProvider has
      // finished initializing, so `auth.user` is still null here.
      const stored = await userManager.getUser()
      if (stored && !stored.expired) {
        setReady(true)
        return
      }

      try {
        const user = await userManager.signinSilent()
        if (user && !user.expired) {
          setReady(true)
          return
        }
      } catch {
        // no iframe-reachable SSO session — fall through to the redirect probe
      }

      // A racing StrictMode effect (or another tab) may have completed
      // sign-in while the iframe attempt was failing — don't probe if a
      // session exists now.
      const current = await userManager.getUser()
      if (current && !current.expired) {
        setReady(true)
        return
      }

      if (!ssoProbeStarted) {
        ssoProbeStarted = true
        sessionStorage.setItem(
          SSO_RETURN_KEY,
          window.location.pathname + window.location.search,
        )
        // Navigates away; the callback route takes it from here.
        await userManager.signinRedirect({ prompt: 'none' })
        return
      }

      setReady(true)
    }

    restoreSession()
    // Run once on mount — this is the app's boot gate
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-y-4 bg-stone-100">
        <img
          src="/images/logo.png"
          alt={t('common.appName')}
          className="h-16 w-auto animate-pulse"
        />
      </div>
    )
  }

  return <>{children}</>
}
