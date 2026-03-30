import { axiosInstance } from './client'

/**
 * Save reading position for a book
 * @param {string} bookId - The book ID
 * @param {Object} position - Position object with location, percentage, chapter, timestamp
 * @returns {Promise<Object>} - Response data from server
 */
export const saveReadingPosition = async (bookId, position) => {
  try {
    const response = await axiosInstance.post('/reader/reading-position', {
      bookId,
      location: position.location,
      percentage: position.percentage,
      chapter: position.chapter,
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
 * @returns {Promise<Object|null>} - Position object or null if not found
 */
export const getReadingPosition = async (bookId) => {
  try {
    const response = await axiosInstance.get(`/reader/reading-position/${bookId}`)
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
 * Get all reading positions for current user
 * @returns {Promise<Object>} - Map of bookId to position objects
 */
export const getAllReadingPositions = async () => {
  try {
    const response = await axiosInstance.get('/reader/reading-positions')
    return response.data
  } catch (error) {
    console.error('[API] Failed to fetch reading positions:', error)
    throw error
  }
}

/**
 * Clear reading position for a book
 * @param {string} bookId - The book ID
 * @returns {Promise<void>}
 */
export const clearReadingPosition = async (bookId) => {
  try {
    await axiosInstance.delete(`/reader/reading-position/${bookId}`)
  } catch (error) {
    console.error('[API] Failed to clear reading position:', error)
    throw error
  }
}
