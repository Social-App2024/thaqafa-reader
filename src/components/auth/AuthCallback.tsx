import { useEffect, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authCallback } from '../../api/auth'
import { SSO_RETURN_KEY, userManager } from '../../data/oidc'

/**
 * Landing route for the Auth0 redirect (`/auth/callback`), mirroring
 * Thaqafa-Frontend's loginCallback: once the OIDC session is established,
 * register/authenticate the user against the backend, then go back to
 * where the login started (or home).
 *
 * Also absorbs the error return of AuthGate's `prompt=none` SSO probe:
 * - `error=login_required` — no Auth0 session; the user is sent back to the
 *   page the probe started from and the app continues unauthenticated
 *   (demo/offline fallback).
 * - `error=consent_required` — a session EXISTS but Auth0 refuses silent
 *   auth on localhost (localhost is never a verifiable first-party app, so
 *   consent can never be skipped there). Fall back to one plain interactive
 *   redirect: while the session is alive Auth0 shows at most a one-click
 *   consent screen — no credential re-entry. Seamless (no interaction) on
 *   production domains, where prompt=none simply succeeds instead.
 */

// Remembers which probe already fell back to an interactive redirect (keyed
// by the probe's `state` param), so a repeated error can never loop.
const SSO_FALLBACK_USED_KEY = 'auth:sso-fallback-state'

export default function AuthCallback() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const requestSent = useRef(false)

  useEffect(() => {
    if (auth.error) {
      const returnTo = sessionStorage.getItem(SSO_RETURN_KEY) ?? '/'
      sessionStorage.removeItem(SSO_RETURN_KEY)

      // consent_required means an Auth0 SSO session EXISTS, but the
      // prompt=none probe can't use it: Auth0 never treats localhost as a
      // verifiable first-party app, so silent auth always fails this way in
      // local dev. Fall back to a plain interactive redirect — while the
      // SSO session is alive it needs no credentials (at most a one-click
      // consent screen on localhost; nothing at all on a real domain).
      // login_required means no SSO session — just continue unauthenticated.
      const oidcError =
        (auth.error as any)?.innerError?.error ?? (auth.error as any)?.error
      const probeState = new URLSearchParams(window.location.search).get('state')
      const fallbackUsedFor = sessionStorage.getItem(SSO_FALLBACK_USED_KEY)
      if (
        oidcError === 'consent_required' &&
        probeState &&
        fallbackUsedFor !== probeState
      ) {
        sessionStorage.setItem(SSO_FALLBACK_USED_KEY, probeState)
        userManager.signinRedirect({ state: { returnTo } })
        return
      }

      console.error('[Auth] Sign-in redirect failed:', auth.error)
      navigate(returnTo, { replace: true })
      return
    }

    if (!auth.isAuthenticated || requestSent.current) return
    requestSent.current = true

    const returnTo =
      (auth.user?.state as { returnTo?: string } | undefined)?.returnTo ??
      sessionStorage.getItem(SSO_RETURN_KEY) ??
      '/'
    sessionStorage.removeItem(SSO_RETURN_KEY)

    const finishLogin = async () => {
      try {
        await authCallback(auth.user?.profile.email ?? '')
      } catch (err) {
        // ProfileProvider will fall back to offline mode; reading still works
        console.error('[Auth] Backend /users/callback failed:', err)
      } finally {
        navigate(returnTo, { replace: true })
      }
    }

    finishLogin()
  }, [auth.isAuthenticated, auth.error, auth.user, navigate])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-y-4">
      <img
        src="/images/logo.png"
        alt={t('common.appName')}
        className="h-16 w-auto animate-pulse"
      />
      <div className="text-lg font-poppins text-stone-600">
        {t('auth.signingIn')}
      </div>
    </div>
  )
}
