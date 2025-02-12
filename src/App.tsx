import { BrowserRouter, Route, NavLink, Routes } from 'react-router-dom'
import cx from 'classnames'

import BooksList from './components/BooksList'
import { useRef } from 'react'
import Reader from './components/Reader'

const App = () => {
  const readerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative h-full w-full min-h-screen flex flex-col justify-center items-center bg-stone-100 p-4">
      <main className="flex items-start gap-x-4 max-w-[80vw] w-full">
        <div ref={readerRef} className="grow relative ml-40 md:ml-44">
          <div className="hidden md:block absolute w-40 top-0 -left-44 h-full overflow-y-auto">
            <BooksList />
          </div>
          <Reader />
        </div>
      </main>
    </div>
  )
}

export default App
