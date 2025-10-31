import './index.css'

import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BooksProvider } from './data/booksProvider'
import { DarkModeProvider } from './data/darkModeProvider'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <DarkModeProvider>
        <BooksProvider>
          <App />
        </BooksProvider>
      </DarkModeProvider>
    </BrowserRouter>
  </StrictMode>,
)
