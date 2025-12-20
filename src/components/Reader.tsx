import { useState, useRef, useEffect } from 'react'
import { ReactReader } from '../../lib/index'
import type { Contents, Rendition } from 'epubjs'

import { DEMO_URL, DEMO_NAME } from '../components/config'
import { Example } from '../components/Example'
import ReaderWrapper from './ReaderWrapper'
import { useBooks } from '../data/booksProvider'
import { useDarkMode } from '../data/darkModeProvider'
import { ReactReaderStyle } from '../../lib/ReactReader/style'
import { PubSub } from "../util/pubSub";
import { ShareContextMenu } from './ShareContextMenu'

export const Reader = () => {
  const booksContext = useBooks() as any
  const { isDarkMode } = useDarkMode()
  const [largeText, setLargeText] = useState(false)
  const rendition = useRef<Rendition | undefined>(undefined)
  const [location, setLocation] = useState<string | number>(0)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; bookTitle: string; bookAuthor: string } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pubsubRef = useRef(new PubSub());

  useEffect(() => {
    rendition.current?.themes.fontSize(largeText ? '140%' : '100%')
  }, [largeText])

  // Apply dark mode theme
  const applyTheme = () => {
    if (rendition.current) {
      if (isDarkMode) {
        rendition.current.themes.override('color', '#e5e5e5')
        rendition.current.themes.override('background', '#000000')
      } else {
        rendition.current.themes.override('color', '#000000')
        rendition.current.themes.override('background', '#ffffff')
      }
    }
  }

  useEffect(() => {
    applyTheme()
  }, [isDarkMode])

  // Reset location when book changes
  useEffect(() => {
    setLocation(0)
    setContextMenu(null) // Close context menu when book changes
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
            (e: MouseEvent) => {},
            'hl',
            { fill: '#03b1fc', 'fill-opacity': '0.5', 'mix-blend-mode': 'multiply' }
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

              // Publish event to show context menu via PubSub pattern
              pubsubRef.current.publish('showContextMenu', {
                x: iframeRect.left + rangeRect.left + (rangeRect.width / 2),
                y: iframeRect.top + rangeRect.bottom + 5,
                text: selectedText,
                bookTitle: bookTitle,
                bookAuthor: bookAuthor
              });
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
  const bookAuthor = booksContext?.selectedBook?.author || 'Unknown Author'

  // Subscribe to showContextMenu event
  useEffect(() => {
    const pubsub = pubsubRef.current;
    const subscription = pubsub.subscribe('showContextMenu', (_topic: string, data: any) => {
      setContextMenu(data);
    });

    return () => {
      pubsub.unsubscribe(subscription);
    };
  }, []);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

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
          // Apply theme immediately when rendition is ready
          applyTheme()
        }}
        readerStyles={{
          ...ReactReaderStyle,
          readerArea: {
            ...ReactReaderStyle.readerArea,
            backgroundColor: isDarkMode ? '#000000' : '#ffffff',
          },
        }}
      />
      <ShareContextMenu contextMenu={contextMenu} onClose={handleCloseContextMenu} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ReaderWrapper>
  )
}

export default Reader
