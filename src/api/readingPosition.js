import { api } from './client'

/**
 * Save reading position for a book
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID
 * @param {Object} position - Position object with location, currentPage, totalPages, timestamp
 * @returns {Promise<Object>} - Response data from server
 */
export const saveReadingPosition = async (bookId, userId, position) => {
  try {
    const response = await api.post('/reader/reading-position', {
      bookId,
      userId,
      location: position.location,
      currentPage: position.currentPage,
      totalPages: position.totalPages,
      timestamp: position.timestamp
    })
    return response.data
  } catch (error) {
    console.error('[API] Failed to save reading position:', error)
    throw error
  }
}

/**
 * Get reading position for a specific book
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - Position object or null if not found
 */
export const getReadingPosition = async (bookId, userId) => {
  try {
    const response = await api.get(`/reader/reading-position/${userId}/${bookId}`)
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      return null // No saved position
    }
    console.error('[API] Failed to fetch reading position:', error)
    throw error
  }
}

/**
 * Get all reading positions for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Map of bookId to position objects
 */
export const getAllReadingPositions = async (userId) => {
  try {
    const response = await api.get(`/reader/reading-positions/${userId}`)
    return response.data
  } catch (error) {
    console.error('[API] Failed to fetch reading positions:', error)
    throw error
  }
}

/**
 * Clear reading position for a book
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const clearReadingPosition = async (bookId, userId) => {
  try {
    await api.delete(`/reader/reading-position/${userId}/${bookId}`)
  } catch (error) {
    console.error('[API] Failed to clear reading position:', error)
    throw error
  }
}
