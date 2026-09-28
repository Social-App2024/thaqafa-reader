import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { Selection } from './examples/Selection'
import { Styling } from './examples/Styling'
import { PubSubProvider } from './context/PubSubContext'
import { NotificationContainer } from './components/NotificationContainer'
import { usePubSub } from './context/PubSubContext'
import AuthCallback from './components/auth/AuthCallback'
import SilentCallback from './components/auth/SilentCallback'
import LogoutCallback from './components/auth/LogoutCallback'
import Login from './components/auth/Login'
import Logout from './components/auth/Logout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './routes/home'

const BookIdPathRedirect = () => {
  const location = useLocation()
  const match = location.pathname.match(/^\/bookId=([^/]+)$/)
  if (match) {
    return <Navigate to={`/?bookId=${encodeURIComponent(match[1])}`} replace />
  }
  return <Navigate to="/" replace />
}

const AppContent = () => {
  const pubsub = usePubSub()

  return (
    <>
      {/* <div className="relative h-full w-full min-h-screen flex flex-col gap-y-8 bg-stone-100 p-4"> */}
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/selection" element={<Selection />} />
          <Route path="/styling" element={<Styling />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/silent/callback" element={<SilentCallback />} />
        <Route path="/logout/callback" element={<LogoutCallback />} />
        <Route path="*" element={<BookIdPathRedirect />} />
      </Routes>
      {/* </div> */}
      {/* Global NotificationContainer - displays notifications from anywhere in the app */}
      <NotificationContainer pubsub={pubsub} />
    </>
  )
}

const App = () => {
  return (
    <PubSubProvider>
      <AppContent />
    </PubSubProvider>
  )
}

export default App
