import './index.css'

import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BooksProvider } from './data/booksProvider'
import { DarkModeProvider } from './data/darkModeProvider'
import { ReadingPositionProvider } from './data/readingPositionProvider'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <ReadingPositionProvider>
        <DarkModeProvider>
          <BooksProvider>
            <App />
          </BooksProvider>
        </DarkModeProvider>
      </ReadingPositionProvider>
    </BrowserRouter>
  </StrictMode>,
)
