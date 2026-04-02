import { Route, Routes } from 'react-router-dom'

import BooksList from './components/BooksList'
import { useRef } from 'react'
import Reader from './components/Reader'
import NavBarMock from './components/NavbarMock'
import { Selection } from './examples/Selection'
import { Styling } from './examples/Styling'
import { PubSubProvider } from './context/PubSubContext'
import { NotificationContainer } from './components/NotificationContainer'
import { usePubSub } from './context/PubSubContext'

const AppContent = () => {
  const readerRef = useRef<HTMLDivElement>(null)
  const pubsub = usePubSub()

  return (
    <>
      <div className="relative h-full w-full min-h-screen flex flex-col gap-y-8 bg-stone-100 p-4">
        {/* HEADER IS ONLY THERE FOR MOCKING PURPOSES, FEEL FREE TO REMOVE IT IF YOU WANT THE CLEAN PAGE! */}
        <NavBarMock />
        <div className="flex flex-col w-full">
          <Routes>
            <Route path="/" element={
              <div className="flex items-start gap-x-4 w-full">
                <div className="hidden md:block w-40 h-screen overflow-y-auto">
                  <BooksList />
                </div>
                <div ref={readerRef} className="grow relative">
                  <Reader />
                </div>
              </div>
            } />
            <Route path="/selection" element={<Selection />} />
            <Route path="/styling" element={<Styling />} />
          </Routes>
        </div>
      </div>
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
