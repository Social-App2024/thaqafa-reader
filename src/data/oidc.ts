import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'

/**
 * OIDC/Auth0 setup, shared with Thaqafa-Frontend (`src/data/auth/oidc.js`
 * there): same authority, client_id and audience, so one Auth0 SSO session
 * covers both apps — logging into either logs into the other.
 *
 * NOTE: this file is gitignored on purpose (environment-specific Auth0
 * config). Keep it in sync with Thaqafa-Frontend when the Auth0 app changes.
 *
 * Redirect URIs derive from the current origin so the same build works on
 * localhost:3000 and the production domain (both must be registered as
 * allowed callback/logout URLs in the Auth0 application).
 */
const origin = window.location.origin

export const oidcConfig = {
  authority: 'https://dev-ja0mtjezourcmlsm.us.auth0.com/',
  client_id: '2380W3JH8fky1VApavGCt1SkwerrVFTN',
  redirect_uri: `${origin}/auth/callback`,
}

export const userManager = new UserManager({
  ...oidcConfig,
  scope: 'openid profile email',
  response_type: 'code',
  silent_redirect_uri: `${origin}/auth/silent/callback`,
  post_logout_redirect_uri: `${origin}/logout/callback`,
  automaticSilentRenew: true,
  extraQueryParams: {
    audience: 'https://social-api/',
  },
  // Persist the session across tabs and browser restarts (library default is
  // tab-scoped sessionStorage) — required for the shared SSO login with
  // Thaqafa-Frontend to survive beyond the current tab.
  // userStore: new WebStorageStateStore({ store: window.localStorage }),
})

// sessionStorage key under which AuthGate's `prompt=none` SSO probe remembers
// the page it started from; AuthCallback navigates back there when Auth0
// answers the probe with an error (e.g. `login_required` — no SSO session).
export const SSO_RETURN_KEY = 'auth:sso-return'

// Strip the code/state params Auth0 appended to the callback URL once the
// sign-in response has been consumed — AuthCallback takes navigation from
// here (it goes to `user.state.returnTo` or the stored SSO return page).
export const onSigninCallback = (_user: User | undefined): void => {
  window.history.replaceState({}, document.title, window.location.pathname)
}
