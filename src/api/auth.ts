import type { AxiosError } from 'axios'
import { authApi } from './client'

export async function authCallback(email: string) {
  try {
    const body = {
      email,
    }
    const response = await authApi.post('/users/callback', body)
    return response
  } catch (err) {
    const status = (err as AxiosError).response?.status
    const data = (err as AxiosError).response?.data
    console.log(status)
    console.log(data)
  }
}
