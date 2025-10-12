import { useCallback, useState, useMemo } from 'react'
import { useBooks } from '../data/booksProvider'

const BooksList = () => {
  const { books, selectedBook, setSelectedBook } = useBooks()
  const [searchQuery, setSearchQuery] = useState('')

  const getThumbnail = useCallback((index) => {
    return `/images/book${index + 1}.jpg`
  }, [])

  const handleBookClick = useCallback((book) => {
    setSelectedBook(book)
  }, [setSelectedBook])

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books

    const query = searchQuery.toLowerCase()
    return books.filter((book) =>
      book.title?.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query)
    )
  }, [books, searchQuery])

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="w-full max-w-[130px]">
        <input
          type="text"
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {filteredBooks.map((book, index) => (
        <div key={book.bookId} onClick={() => handleBookClick(book)} className="cursor-pointer">
          <img
            className="w-30 h-30 max-w-[130px]"
            src={getThumbnail(index)}
          ></img>
        </div>
      ))}
    </div>
  )
}

export default BooksList
