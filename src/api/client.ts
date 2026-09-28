import axios from 'axios'
import type { User } from 'oidc-client-ts'
import { userManager } from '../data/oidc'

const API_URL = 'http://localhost:9092/'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

export const authApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
})

authApi.interceptors.request.use(async (config) => {
  const user = await userManager.getUser()
  if (user && !user.expired) {
    config.headers.Authorization = `Bearer ${user.access_token}`
  }
  return config
})

let renewal: Promise<User | null> | null = null
const renewToken = () =>
  (renewal ??= userManager.signinSilent().finally(() => {
    renewal = null
  }))

authApi.interceptors.response.use(undefined, async (error) => {
  const original = error.config
  if (error.response?.status !== 401 || !original || original._retried) {
    return Promise.reject(error)
  }
  original._retried = true

  let user: User | null = null
  try {
    user = await renewToken()
  } catch {
    user = null // no SSO session; nothing to renew with
  }

  if (user) {
    // fresh token acquired — the request interceptor reattaches it
    return authApi(original)
  }

  // Silent renew failed. Do NOT removeUser() here: a flaky renew (blocked
  // iframe cookies, offline, racing pre-login request) must not destroy a
  // stored session. Just reject — callers degrade to demo/offline mode, and
  // the next request will reattach the still-valid stored token.
  return Promise.reject(error)
})
