import { api } from "./client.js";

/**
 * Fetches protected EPUB content as a blob
 * @param {string} bookId - The unique book identifier
 * @returns {Promise<Blob>} - EPUB file as blob
 * @throws {Error} - On fetch failure with descriptive message
 */
export async function fetchBookContent(bookId) {
  if (!bookId) {
    throw new Error("Invalid bookId: cannot fetch book content");
  }

  try {
    const response = await api.get(`/reader/book-content/${bookId}`, {
      responseType: 'blob',  // Critical for binary data
      timeout: 60000,        // 60 seconds for large EPUBs
    });

    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error("Invalid response: expected blob data");
    }

    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (error.response?.status === 401) {
      throw new Error("Authentication required. Please log in.");
    } else if (error.response?.status === 403) {
      throw new Error("Access denied. You haven't purchased this book.");
    } else if (error.response?.status === 404) {
      throw new Error("Book not found.");
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("Request timeout. The book file is too large or connection is slow.");
    } else {
      throw new Error(`Failed to fetch book content: ${error.message}`);
    }
  }
}
