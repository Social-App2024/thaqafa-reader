import { createContext, useState, useContext, useEffect } from "react";
import { ViewPurchasedBooks } from "../api/booksList";

const BooksContext = createContext(undefined);

// Fixed books list as fallback
const fixedBooksList = [{
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

  const [books, setBooks] = useState(fixedBooksList);
  const [selectedBook, setSelectedBook] = useState(myBook);
  //const [cookies, setCookie] = useCookies(['profile_name', 'profile_photo']);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const fetchedBooks = await ViewPurchasedBooks('66b7a5025cf5d67e2eeaa1fb');
        if (fetchedBooks && Array.isArray(fetchedBooks) && fetchedBooks.length > 0) {
          setBooks(fetchedBooks);
        } else {
          console.warn('API returned invalid data, using fixed books list');
        }
      } catch (error) {
        // Handle authentication errors and other failures gracefully
        if (error.response?.status === 401) {
          console.warn('Authentication required. Using fixed books list for demo.');
          console.info('To authenticate: import { setAccessToken } from "./api/client" and call setAccessToken("your_token")');
        } else {
          console.error('Failed to fetch books:', error.message);
        }
        // Keep the fixedBooksList as fallback (already set in initial state)
      }
    };

    fetchBooks();
  }, []);

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
