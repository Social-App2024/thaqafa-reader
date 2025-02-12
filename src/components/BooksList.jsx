import { useCallback } from 'react'
import { useBooks } from '../data/booksProvider'

export const BooksList = () => {
    const { books, selectedBook } = useBooks()

    const getThumbnail = useCallback((index) => {
        return `/images/book${index + 1}.jpg`
    }, [])

    return (
        <div className="flex flex-col gap-4 py-8 px-4 items-center">
            {books.map((book, index) => (
                <>
                    <a href={book.url}>
                        <img
                            className="w-30 h-30 max-w-[130px]"
                            src={getThumbnail(index)}
                        ></img>
                    </a>
                </>
            ))}
        </div>
    )
}
