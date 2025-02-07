import './index.css'

import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import {BooksProvider} from './data/booksProvider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BooksProvider>
        <App />
    </BooksProvider>
  </StrictMode>
)
