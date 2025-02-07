import { createContext, useState, useContext } from "react";

const BooksContext = createContext(null);

const booksList = [{
    bookId: "1",
    title: "Book 1",
    url: "/files/alice.epub", 
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
},
{
    bookId: "2",
    title: "Book 2",
    url: "/files/alice.epub", 
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
},
{
    bookId: "3",
    title: "Book 3",
    url: "/files/alice.epub", 
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
},
{
    bookId: "4",
    title: "Book 4",
    url: "/files/alice.epub", 
    author: "Hofman", 
    desc: "fiction",
    isRTL: false,
    tags: null
}];

const myBook = {
    bookId: "2",
    title: "Book 2",
    url: "/files/alice.epub", 
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
        selectedBook: selectedBook
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
