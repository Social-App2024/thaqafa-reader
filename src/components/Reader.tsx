import { useState, useRef, useEffect } from 'react'
import { ReactReader } from '../../lib/index'
import type { Contents, Rendition } from 'epubjs'

import { DEMO_URL, DEMO_NAME } from '../components/config'
import { Example } from '../components/Example'
import ReaderWrapper from './ReaderWrapper'
import { useBooks } from '../data/booksProvider'

export const Reader = () => {
  const booksContext = useBooks() as any
  const [largeText, setLargeText] = useState(false)
  const rendition = useRef<Rendition | undefined>(undefined)
  const [location, setLocation] = useState<string | number>(0)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null)
  const [highlightedText, setHighlightedText] = useState<string>('')

  useEffect(() => {
    rendition.current?.themes.fontSize(largeText ? '140%' : '100%')
  }, [largeText])

  // Reset location when book changes
  useEffect(() => {
    setLocation(0)
  }, [booksContext?.selectedBook?.url])

  // Handle text selection and highlighting
  useEffect(() => {
    if (rendition.current) {
      let currentHighlight: string | null = null
      let currentContents: Contents | null = null

      function setRenderSelection(cfiRange: string, contents: Contents) {
        if (rendition.current) {
          // Remove previous highlight if exists
          if (currentHighlight) {
            rendition.current.annotations.remove(currentHighlight, 'highlight')
          }

          const selectedText = rendition.current.getRange(cfiRange).toString()
          console.log('Selected text:', selectedText)
          setHighlightedText(selectedText)

          rendition.current.annotations.add(
            'highlight',
            cfiRange,
            {},
            (e: MouseEvent) => {
              // Show context menu on highlight click
              const iframe = document.querySelector('iframe')
              if (iframe) {
                const iframeRect = iframe.getBoundingClientRect()
                setContextMenu({
                  x: iframeRect.left + e.clientX,
                  y: iframeRect.top + e.clientY + 10,
                  text: selectedText
                })
              }
            },
            'hl',
            { fill: 'red', 'fill-opacity': '0.5', 'mix-blend-mode': 'multiply' }
          )

          currentHighlight = cfiRange
          currentContents = contents

          // Show context menu immediately after selection
          // Get the actual bounding rectangle of the selected text from the iframe content
          const selection = contents.window.getSelection()
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rangeRect = range.getBoundingClientRect()

            // Get iframe position on the page
            const iframe = document.querySelector('iframe')
            if (iframe) {
              const iframeRect = iframe.getBoundingClientRect()

              // Calculate absolute position: iframe position + range position within iframe
              setContextMenu({
                x: iframeRect.left + rangeRect.left + (rangeRect.width / 2),
                y: iframeRect.top + rangeRect.bottom + 5,
                text: selectedText
              })
            }
          }

          selection?.removeAllRanges()
        }
      }

      function handleMouseDown() {
        // Close context menu
        setContextMenu(null)

        // Remove highlight when mouse is pressed elsewhere
        if (currentHighlight && rendition.current) {
          rendition.current.annotations.remove(currentHighlight, 'highlight')
          currentHighlight = null
          setHighlightedText('')
        }
        if (currentContents) {
          const selection = currentContents.window.getSelection()
          selection?.removeAllRanges()
        }
      }

      // Close context menu on window resize to prevent positioning issues
      function handleResize() {
        setContextMenu(null)
      }

      rendition.current.on('selected', setRenderSelection)
      rendition.current.on('mousedown', handleMouseDown)
      window.addEventListener('resize', handleResize)

      return () => {
        rendition.current?.off('selected', setRenderSelection)
        rendition.current?.off('mousedown', handleMouseDown)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [rendition.current])

  const bookUrl = booksContext?.selectedBook?.url || DEMO_URL
  const bookTitle = booksContext?.selectedBook?.title || DEMO_NAME

  const handleShare = () => {
    console.log(`shared text: ${contextMenu?.text}`)
    setContextMenu(null)
  }

  return (
    <ReaderWrapper>
      <ReactReader
        url={bookUrl}
        title={bookTitle}
        location={location}
        locationChanged={(loc: string) => setLocation(loc)}
        getRendition={(_rendition: Rendition) => {
          rendition.current = _rendition
          rendition.current.themes.fontSize(largeText ? '140%' : '100%')
        }}
      />

      {contextMenu && (
        <div
          className="fixed bg-gray-200 text-gray-700 rounded shadow-lg z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            className="px-3 py-1 hover:bg-gray-300 w-full text-left text-sm"
            onClick={handleShare}
          >
            Share
          </button>
        </div>
      )}
    </ReaderWrapper>
  )
}

export default Reader
