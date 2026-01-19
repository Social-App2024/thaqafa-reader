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
    console.log('[BookContent API] Starting fetch for bookId:', bookId)
    const response = await api.get(`/reader/content/${bookId}?userId=66b7a5025cf5d67e2eeaa1fb`, {
      responseType: 'blob',  // Critical for binary data
      timeout: 60000,        // 60 seconds for large EPUBs
    });

    console.log('[BookContent API] Response received:', {
      bookId,
      dataType: typeof response.data,
      isBlob: response.data instanceof Blob,
      blobSize: response.data?.size,
      blobType: response.data?.type,
      status: response.status,
      headers: response.headers
    })

    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error("Invalid response: expected blob data");
    }

    console.log('[BookContent API] ✓ Successfully fetched blob for bookId:', bookId, 'size:', response.data.size, 'bytes')
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
