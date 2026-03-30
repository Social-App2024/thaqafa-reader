import { api } from './client'

/**
 * Fetch current user profile
 * @returns {Promise<Object>} - User profile object
 */
export const fetchUserProfile = async () => {
  try {
    const response = await api.get('/users/me')
    return response.data
  } catch (error) {
    console.error('[API] Failed to fetch user profile:', error)
    throw error
  }
}
