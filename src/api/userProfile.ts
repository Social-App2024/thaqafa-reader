import { api } from './client'

/**
 * Fetch current user profile
 * @returns {Promise<Object>} - User profile object
 */
export const fetchUserProfile = async (token: string | undefined) => {
  if (!token) throw new Error('Unauthorized request.')
  try {
    const { data } = await api.get('/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return data
  } catch (error) {
    console.error('[API] Failed to fetch user profile:', error)
    throw error
  }
}
