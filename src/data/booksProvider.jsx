import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ViewPurchasedBooks } from "../api/booksList";

const BooksContext = createContext(undefined);
const SELECTED_BOOK_KEY = "thaqafa_selected_book";

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

const getStoredBook = () => {
  try {
    const stored = localStorage.getItem(SELECTED_BOOK_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveBookToStorage = (book) => {
  try {
    localStorage.setItem(SELECTED_BOOK_KEY, JSON.stringify(book));
  } catch (error) {
    console.warn('Failed to save book to localStorage:', error);
  }
};

const findBookById = (booksList, bookId) => {
  if (!bookId) return null;
  return booksList.find(book => String(book.bookId) === String(bookId)) || null;
};

const getInitialBook = (booksList, urlBookId) => {
  return findBookById(booksList, urlBookId) || getStoredBook() || booksList[0];
};

export const BooksProvider = ({ children }) => {
  const [books, setBooks] = useState(fixedBooksList);
  const [searchParams] = useSearchParams();
  const urlBookId = searchParams.get('bookId');
  const [selectedBook, setSelectedBook] = useState(() => getInitialBook(fixedBooksList, urlBookId));

  // A ?bookId= URL param takes precedence over the stored selection
  useEffect(() => {
    const urlBook = findBookById(books, urlBookId);
    if (urlBook) {
      handleSetSelectedBook(urlBook);
    }
  }, [books, urlBookId]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const fetchedBooks = await ViewPurchasedBooks();
        if (fetchedBooks && Array.isArray(fetchedBooks) && fetchedBooks.length > 0) {
          setBooks(fetchedBooks);

          const urlBook = findBookById(fetchedBooks, urlBookId);
          if (urlBook) {
            handleSetSelectedBook(urlBook);
            return;
          }

          const storedBook = getStoredBook();
          const isStoredBookValid = storedBook && fetchedBooks.some(book => book.bookId === storedBook.bookId);

          if (!isStoredBookValid) {
            setSelectedBook(fetchedBooks[0]);
          }
        } else {
          console.warn('API returned invalid data, using fixed books list');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.warn('Authentication required. Using fixed books list for demo.');
          console.info('To authenticate: import { setAccessToken } from "./api/client" and call setAccessToken("your_token")');
        } else {
          console.error('Failed to fetch books:', error.message);
        }
      }
    };

    fetchBooks();
  }, []);

  const handleSetSelectedBook = (book) => {
    setSelectedBook(book);
    saveBookToStorage(book);
  };

  const contextValue = useMemo(() => ({
    books,
    selectedBook,
    setSelectedBook: handleSetSelectedBook
  }), [books, selectedBook]);

  return (
    <>
      <BooksContext.Provider value={contextValue}>
        {children}
      </BooksContext.Provider>
    </>
  );
};

// export default BooksProvider;

export const useBooks = () => {
  return useContext(BooksContext);
};
