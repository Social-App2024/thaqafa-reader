import { BrowserRouter, Route, NavLink, Routes } from 'react-router-dom'
import cx from 'classnames'

import BooksList from './components/BooksList'
import { useEffect, useRef, useState } from 'react'
import Reader from './components/Reader'

const App = () => {
  const readerRef = useRef<HTMLDivElement>(null)
  const [readerHeight, setReaderHeight] = useState(0)

  useEffect(() => {
    const updateReaderHeight = () => {
      if (readerRef.current) {
        setReaderHeight(readerRef.current.offsetHeight)
      }
    }

    // We create a resize observer to detect changes in size for reader ( mostly from context menus )
    const sizeChangeObserver = new ResizeObserver(() => updateReaderHeight())

    if (readerRef.current) {
      sizeChangeObserver.observe(readerRef.current)
      updateReaderHeight()
    }

    // Finally, clean up!
    return sizeChangeObserver.disconnect()
  }, [])

  return (
    <div className="relative h-full w-full min-h-screen flex flex-col justify-center items-center bg-stone-100 p-4">
      <main className="flex items-start gap-x-4 max-w-[80vw] w-full">
        {/* Scrollable Books Sidebar */}
        <div
          className="overflow-y-auto shrink-0"
          style={{
            maxHeight: readerHeight,
          }}
        >
          <BooksList />
        </div>
        {/* Reader */}
        <div ref={readerRef} className="grow">
          <Reader />
        </div>
      </main>
    </div>
  )
}

export default App
