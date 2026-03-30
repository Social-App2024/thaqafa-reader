import { useState, useRef, useEffect, useCallback } from 'react'
import { ReactReader } from '../../lib/index'
import type { Contents, Rendition } from 'epubjs'

import { DEMO_URL, DEMO_NAME } from '../components/config'
import { Example } from '../components/Example'
import ReaderWrapper from './ReaderWrapper'
import { useBooks } from '../data/booksProvider'
import { useDarkMode } from '../data/darkModeProvider'
import { useReadingPosition } from '../data/readingPositionProvider'
import { ReactReaderStyle } from '../../lib/ReactReader/style'
import { PubSub } from "../util/pubSub";
import { ShareContextMenu } from './ShareContextMenu'
import { fetchBookContent } from '../api/bookContent'

export const Reader = () => {
  const booksContext = useBooks() as any
  const { isDarkMode } = useDarkMode()
  const { getPosition, savePosition } = useReadingPosition()
  const [largeText, setLargeText] = useState(false)
  const rendition = useRef<Rendition | undefined>(undefined)
  const [location, setLocation] = useState<string | number>(0)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pubsubRef = useRef(new PubSub());
  const saveTimerRef = useRef<number | null>(null)
  const [bookBlobUrl, setBookBlobUrl] = useState<string | ArrayBuffer | null>(null)
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

  // Restore saved location when book changes (ONLY when bookId changes, not when positions update)
  useEffect(() => {
    const bookId = booksContext?.selectedBook?.bookId

    // Clear any pending save timers
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    if (bookId) {
      const savedPosition = getPosition(bookId)
      if (savedPosition) {
        console.log('[Reader] Restoring position:', bookId, savedPosition.location)
        setLocation(savedPosition.location)
      } else {
        console.log('[Reader] No saved position, starting from beginning')
        setLocation(0)
      }
    } else {
      setLocation(0)
    }

    // Publish event to close context menu when book changes
    pubsubRef.current.publish('closeContextMenu')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booksContext?.selectedBook?.bookId])

  // Fetch and manage EPUB content (ArrayBuffer or URL)
  useEffect(() => {
    const selectedBook = booksContext?.selectedBook
    let isMounted = true

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
      console.log('[Blob Effect] Using public URL for demo book:', selectedBook.url)
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
        console.log('[Blob Effect] Fetching protected EPUB for bookId:', selectedBook.bookId)
        const blob = await fetchBookContent(selectedBook.bookId)

        if (!isMounted) {
          // Component unmounted during fetch, don't update state
          return
        }

        // Convert blob to ArrayBuffer for EPUB.js (more reliable than blob URLs)
        console.log('[Blob Effect] Converting blob to ArrayBuffer...')
        const arrayBuffer = await blob.arrayBuffer()

        console.log('[Blob Effect] ArrayBuffer created:', {
          byteLength: arrayBuffer.byteLength,
          bookId: selectedBook.bookId
        })

        // Validate EPUB structure (basic ZIP check)
        try {
          const view = new Uint8Array(arrayBuffer)
          const isPKZip = view[0] === 0x50 && view[1] === 0x4B // PK signature

          if (!isPKZip) {
            console.error('[Blob Effect] File is not a valid ZIP/EPUB (missing PK signature)')
            throw new Error('Invalid EPUB file format. The file does not appear to be a valid EPUB.')
          }

          console.log('[Blob Effect] ✅ EPUB ZIP signature validated')
        } catch (validationError) {
          console.error('[Blob Effect] EPUB validation failed:', validationError)
          throw validationError
        }

        setBookBlobUrl(arrayBuffer)
        setIsLoadingBook(false)
        console.log('[Blob Effect] ✅ Book loaded successfully as ArrayBuffer for:', selectedBook.bookId)
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
      // No cleanup needed for ArrayBuffer (garbage collected automatically)
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

  // Debounced save function for reading position
  const debouncedSavePosition = useCallback((loc: string | number) => {
    const bookId = booksContext?.selectedBook?.bookId

    // Don't save initial position or missing bookId
    if (!bookId || loc === 0) return

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Save after 1 second of no changes
    saveTimerRef.current = window.setTimeout(() => {
      console.log('[Reader] Saving position:', bookId, loc)

      // Extract page information from rendition
      const metadata: any = { location: loc }

      if (rendition.current?.location?.start?.displayed) {
        metadata.currentPage = rendition.current.location.start.displayed.page
        metadata.totalPages = rendition.current.location.start.displayed.total
      }

      savePosition(bookId, metadata)
    }, 1000)
  }, [booksContext?.selectedBook?.bookId, savePosition])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const bookUrl = bookBlobUrl || booksContext?.selectedBook?.url || DEMO_URL
  const bookTitle = booksContext?.selectedBook?.title || DEMO_NAME
  const bookAuthor = booksContext?.selectedBook?.author || 'Unknown Author'

  console.log('[Reader Render]', {
    isLoadingBook,
    bookBlobUrlType: bookBlobUrl instanceof ArrayBuffer ? 'ArrayBuffer' : typeof bookBlobUrl,
    bookBlobUrlSize: bookBlobUrl instanceof ArrayBuffer ? bookBlobUrl.byteLength : bookBlobUrl?.toString().substring(0, 50),
    bookLoadError,
    bookUrlType: bookUrl instanceof ArrayBuffer ? 'ArrayBuffer' : typeof bookUrl,
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
        locationChanged={(loc: string) => {
          setLocation(loc)
          debouncedSavePosition(loc)
        }}
        getRendition={(_rendition: Rendition) => {
          rendition.current = _rendition
          rendition.current.themes.fontSize(largeText ? '140%' : '100%')

          // Add error handler for EPUB.js errors
          rendition.current.on('displayError', (err: Error) => {
            console.error('[EPUB.js] Display error:', err)
            console.error('[EPUB.js] This usually means the EPUB has an empty or invalid spine.')
            console.error('[EPUB.js] Check content.opf file structure.')
            setBookLoadError(`Cannot display this EPUB: ${err.message}. The EPUB may have an invalid structure (empty spine or missing sections). Please validate the EPUB file with EPUBCheck.`)
            setIsLoadingBook(false)
          })

          // Catch rendering errors
          rendition.current.on('rendered', () => {
            console.log('[EPUB.js] ✅ Page rendered successfully')
          })

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
