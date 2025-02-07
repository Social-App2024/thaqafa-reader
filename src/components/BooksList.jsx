import React from "react";
import { useBooks } from '../data/booksProvider';

export const BooksList = () => {
    const { books,selectedBook } = useBooks();
    return (
    <div className='w-1/4 flex flex-col gap-4 mt-6 p-8 items-center'>
        {books.map((book, index) => (
            <>
                <a href={book.url}><img className="w-30 h-30 max-w-20" src={`/images/book${index+1}.jpg`}></img></a>
            </>
            ))}
    </div>
    )
}