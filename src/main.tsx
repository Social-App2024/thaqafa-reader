import './index.css'
import './i18n'

import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BooksProvider } from './data/booksProvider'
import { DarkModeProvider } from './data/darkModeProvider'
import { ReadingPositionProvider } from './data/readingPositionProvider'
import { ProfileProvider } from './data/profileProvider'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from 'react-oidc-context'
import { onSigninCallback, userManager } from './data/oidc'
import AuthGate from './components/auth/AuthGate'
import { QueryClientProvider } from '@tanstack/react-query'
import QueryClient from './queries/queryClient'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={QueryClient}>
      <BrowserRouter>
        {/* <ProfileProvider> */}
        <DarkModeProvider>
          <AuthProvider
            userManager={userManager}
            onSigninCallback={onSigninCallback}
          >
            <ReadingPositionProvider>
              <AuthGate>
                <BooksProvider>
                  <App />
                </BooksProvider>
              </AuthGate>
            </ReadingPositionProvider>
          </AuthProvider>
        </DarkModeProvider>
        {/* </ProfileProvider> */}
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
