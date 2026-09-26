import { authApi } from './client'

/**
 * Post-login callback: authenticates an existing backend user or registers a
 * new one, keyed on the JWT identity. Idempotent for returning users.
 * (contract: app/api-contracts/users/authCallback.json)
 */
export async function authCallback(email: string) {
  const response = await authApi.post('/users/callback', { email })
  return response.data
}
