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
import { fetchBookContent } from '../api/bookContent'

export const Reader = () => {
  const booksContext = useBooks() as any
  const { isDarkMode } = useDarkMode()
  const [largeText, setLargeText] = useState(false)
  const rendition = useRef<Rendition | undefined>(undefined)
  const [location, setLocation] = useState<string | number>(0)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pubsubRef = useRef(new PubSub());
  const [bookBlobUrl, setBookBlobUrl] = useState<string | null>(null)
  const [isLoadingBook, setIsLoadingBook] = useState(false)
  const [bookLoadError, setBookLoadError] = useState<string | null>(null)

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
    // Publish event to close context menu when book changes
    pubsubRef.current.publish('closeContextMenu')
  }, [booksContext?.selectedBook?.url])

  // Fetch and manage EPUB blob URL
  useEffect(() => {
    const selectedBook = booksContext?.selectedBook
    let isMounted = true
    let currentBlobUrl: string | null = null

    console.log('[Blob Effect] Selected book changed:', {
      bookId: selectedBook?.bookId,
      title: selectedBook?.title,
      url: selectedBook?.url,
      hasUrl: !!selectedBook?.url
    })

    setBookLoadError(null)
    setIsLoadingBook(false)

    if (!selectedBook) {
      setBookBlobUrl(null)
      return
    }

    // Check if book uses legacy public URL (demo mode)
    const isPublicUrl = selectedBook.url?.startsWith('/files/') ||
                        selectedBook.url?.startsWith('http')

    if (isPublicUrl) {
      console.log('Using public URL for demo book:', selectedBook.url)
      setBookBlobUrl(selectedBook.url)
      setIsLoadingBook(false)
      return
    }

    // Book requires authenticated blob fetch
    if (!selectedBook.bookId) {
      setBookLoadError('Invalid book: missing bookId')
      setBookBlobUrl(null)
      setIsLoadingBook(false)
      return
    }

    const loadBookBlob = async () => {
      if (!isMounted) return

      setIsLoadingBook(true)
      setBookLoadError(null)
      setBookBlobUrl(null)

      try {
        console.log('Fetching protected EPUB for bookId:', selectedBook.bookId)
        const blob = await fetchBookContent(selectedBook.bookId)

        if (!isMounted) {
          // Component unmounted during fetch, don't update state
          return
        }

        const objectUrl = URL.createObjectURL(blob)
        currentBlobUrl = objectUrl
        console.log('[Blob Effect] About to set state:', {
          objectUrl: objectUrl.substring(0, 50),
          willSetIsLoadingBook: false
        })
        setBookBlobUrl(objectUrl)
        setIsLoadingBook(false)
        console.log('[Blob Effect] Book blob loaded successfully for:', selectedBook.bookId)
      } catch (error: any) {
        if (!isMounted) return

        console.error('Failed to load book:', error)
        setBookLoadError(error.message || 'Failed to load book')

        // Fallback to public URL if available
        if (selectedBook.url) {
          console.warn('Falling back to public URL:', selectedBook.url)
          setBookBlobUrl(selectedBook.url)
        }
      } finally {
        if (isMounted) {
          setIsLoadingBook(false)
        }
      }
    }

    loadBookBlob()

    // Cleanup on unmount or book change
    return () => {
      isMounted = false
      if (currentBlobUrl) {
        console.log('Revoking blob URL:', currentBlobUrl)
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [booksContext?.selectedBook?.bookId])

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
        // Publish event to close context menu
        pubsubRef.current.publish('closeContextMenu')

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
        pubsubRef.current.publish('closeContextMenu')
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

  const bookUrl = bookBlobUrl || booksContext?.selectedBook?.url || DEMO_URL
  const bookTitle = booksContext?.selectedBook?.title || DEMO_NAME
  const bookAuthor = booksContext?.selectedBook?.author || 'Unknown Author'

  console.log('[Reader Render]', {
    isLoadingBook,
    bookBlobUrl: bookBlobUrl?.substring(0, 50) + '...',
    bookLoadError,
    bookUrl: bookUrl?.substring(0, 50),
    willShowLoading: isLoadingBook,
    willShowError: !!(bookLoadError && !bookBlobUrl),
    willShowReader: !isLoadingBook && !(bookLoadError && !bookBlobUrl)
  })

  // Show loading state while fetching book
  if (isLoadingBook) {
    return (
      <ReaderWrapper>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: isDarkMode ? '#000000' : '#ffffff',
          color: isDarkMode ? '#e5e5e5' : '#000000'
        }}>
          <div style={{ fontSize: '18px' }}>Loading book...</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            {booksContext?.selectedBook?.title}
          </div>
        </div>
      </ReaderWrapper>
    )
  }

  // Show error state if book load failed
  if (bookLoadError && !bookBlobUrl) {
    return (
      <ReaderWrapper>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: isDarkMode ? '#000000' : '#ffffff',
          color: isDarkMode ? '#e5e5e5' : '#000000'
        }}>
          <div style={{ fontSize: '18px', color: '#ff4444' }}>
            Failed to load book
          </div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            {bookLoadError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
              color: isDarkMode ? '#e5e5e5' : '#000000',
              border: '1px solid',
              borderColor: isDarkMode ? '#555' : '#ccc',
              borderRadius: '4px'
            }}
          >
            Retry
          </button>
        </div>
      </ReaderWrapper>
    )
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
      <ShareContextMenu pubsub={pubsubRef.current} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ReaderWrapper>
  )
}

export default Reader
