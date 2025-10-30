import { createContext, useState, useContext } from "react";

const BooksContext = createContext(undefined);

const booksList = [{
    bookId: "1",
    title: "Book 1",
    url: "/files/alice.epub", 
    frontCoverUrl: "/images/book1.jpg",
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
},
{
    bookId: "2",
    title: "Book 2",
    url: "/files/book1.epub", 
    frontCoverUrl: "/images/book2.jpg",
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
},
{
    bookId: "3",
    title: "Book 3",
    url: "/files/book2.epub", 
    frontCoverUrl: "/images/book3.jpg",
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
},
{
    bookId: "4",
    title: "Book 4",
    url: "/files/book3.epub", 
    frontCoverUrl: "/images/book4.jpg",
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
}];

const myBook = {
    bookId: "2",
    title: "Book 2",
    url: "/files/book4.epub", 
    frontCoverUrl: "/images/book4.jpg",
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
};

export const BooksProvider = ({ children }) => {

  const [books, setBooks] = useState(booksList);
  const [selectedBook, setSelectedBook] = useState(myBook);
  //const [cookies, setCookie] = useCookies(['profile_name', 'profile_photo']);

  return (
    <>
      <BooksContext.Provider value={{
        books: books,
        selectedBook: selectedBook,
        setSelectedBook: setSelectedBook
      }}>
        {children}
      </BooksContext.Provider>
    </>
  );
};

// export default BooksProvider;

export const useBooks = () => {
  return useContext(BooksContext);
};
