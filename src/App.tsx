import { BrowserRouter, Route, NavLink, Routes } from 'react-router-dom'
import cx from 'classnames'

import { Basic } from './examples/Basic'
import { Persist } from './examples/Persist'
import { Styling } from './examples/Styling'
import { Paging } from './examples/Paging'
import { Selection } from './examples/Selection'
import { Scroll } from './examples/Scroll'
import { DisableContextMenu } from './examples/DisableContextMenu'
import { SmoothScroll } from './examples/SmoothScroll'
import { CustomFont } from './examples/CustomFont'
import { BooksList } from './components/BooksList'
import { useEffect, useRef, useState } from 'react'

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
    <BrowserRouter>
      <div className="relative h-full w-full min-h-screen bg-stone-100 p-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-4">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <a
              href="https://github.com/gerhardsletten/react-reader"
              className="w-full md:w-[250px]"
            >
              <img
                src="https://react-reader.metabits.no/files/react-reader.svg"
                alt="React-reader - powered by epubjs"
                width="330"
                height="104"
                className="w-60 h-auto block mx-auto"
              />
            </a>
            <nav className="w-full md:w-auto flex items-center justify-center gap-2 flex-wrap">
              {[
                ['Basic', '/'],
                ['Persist', '/persist'],
                ['Styling', '/styling'],
                ['Paging', '/paging'],
                ['Selection', '/selection'],
                ['Smooth Scroll', '/smooth-scroll'],
                ['Scroll', '/scroll'],
                ['Disable context menu', '/disable-context-menu'],
                ['Custom font', '/custom-font'],
              ].map(([label, link], key) => (
                <NavLink
                  to={link}
                  key={key}
                  className={({ isActive }) =>
                    cx('hover:underline', { underline: isActive })
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </header>
          <main className="flex items-start gap-x-4">
            <div
              className="overflow-y-auto shrink-0"
              style={{
                maxHeight: readerHeight,
              }}
            >
              <BooksList />
            </div>
            <div ref={readerRef} className="grow">
              <Routes>
                <Route path="/styling" element={<Styling />} />
                <Route path="/persist" element={<Persist />} />
                <Route path="/paging" element={<Paging />} />
                <Route path="/selection" element={<Selection />} />
                <Route path="/scroll" element={<Scroll />} />
                <Route path="/custom-font" element={<CustomFont />} />
                <Route
                  path="/disable-context-menu"
                  element={<DisableContextMenu />}
                />
                <Route path="/smooth-scroll" element={<SmoothScroll />} />

                <Route path="*" element={<Basic />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
