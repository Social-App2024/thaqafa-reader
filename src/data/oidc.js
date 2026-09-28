import { UserManager } from 'oidc-client-ts'

// export const oidcConfig = {
//   authority: "http://localhost:8080/realms/social-realm",
//   client_id: "thaqafa-web",
//   redirect_uri: "http://localhost:5173/auth/callback",
// };

// Gets rid of the code and other implementation details when the user is redirected after a successful login!
export const onSigninCallback = (_user) => {
  window.history.replaceState({}, document.title, window.location.pathname)
}

export const oidcConfig = {
  authority: 'https://dev-ja0mtjezourcmlsm.us.auth0.com/',
  client_id: '2380W3JH8fky1VApavGCt1SkwerrVFTN',
  redirect_uri: 'http://localhost:3000/auth/callback',
}

export const userManager = new UserManager({
  ...oidcConfig,
  scope: 'openid profile email',
  response_type: 'code',
  silent_redirect_uri: 'http://localhost:3000/auth/silent/callback',
  post_logout_redirect_uri: 'http://localhost:3000/logout/callback',
  automaticSilentRenew: true,
  extraQueryParams: {
    audience: 'https://social-api/',
  },
})
