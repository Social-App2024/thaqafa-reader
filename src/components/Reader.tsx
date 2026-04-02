import { useState, useRef, useEffect, useCallback } from 'react'
import { ReactReader } from '../../lib/index'
import type { Contents, Rendition } from 'epubjs'

import { DEMO_URL, DEMO_NAME } from '../components/config'
import ReaderWrapper from './ReaderWrapper'
import { useBooks } from '../data/booksProvider'
import { useDarkMode } from '../data/darkModeProvider'
import { useReadingPosition } from '../data/readingPositionProvider'
import { useProfile } from '../data/profileProvider'
import { ReactReaderStyle } from '../../lib/ReactReader/style'
import { ShareContextMenu } from './ShareContextMenu'
import { fetchBookContent } from '../api/bookContent'
import { usePubSub } from '../context/PubSubContext'
import { PubSub } from "../util/pubSub"

export const Reader = () => {
  const booksContext = useBooks() as any
  const { isDarkMode } = useDarkMode()
  const { userId } = useProfile()
  const { getPosition, savePosition } = useReadingPosition()
  const [largeText, setLargeText] = useState(false)
  const rendition = useRef<Rendition | undefined>(undefined)
  const [location, setLocation] = useState<string | number>(0)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Use global PubSub from context instead of local instance
  const pubsub = usePubSub()
  const saveTimerRef = useRef<number | null>(null)
  const [bookBlobUrl, setBookBlobUrl] = useState<string | ArrayBuffer | null>(null)
  const [isLoadingBook, setIsLoadingBook] = useState(false)
  const [bookLoadError, setBookLoadError] = useState<string | null>(null)

  const bookId = booksContext?.selectedBook?.bookId
  const bookUrl = bookBlobUrl || booksContext?.selectedBook?.url || DEMO_URL
  const bookTitle = booksContext?.selectedBook?.title || DEMO_NAME
  const bookAuthor = booksContext?.selectedBook?.author || 'Unknown Author'

  // Apply font size when changed
  useEffect(() => {
    rendition.current?.themes.fontSize(largeText ? '140%' : '100%')
  }, [largeText])

  // Apply dark mode theme
  useEffect(() => {
    if (!rendition.current) return

    if (isDarkMode) {
      rendition.current.themes.override('color', '#e5e5e5')
      rendition.current.themes.override('background', '#000000')
    } else {
      rendition.current.themes.override('color', '#000000')
      rendition.current.themes.override('background', '#ffffff')
    }
  }, [isDarkMode])

  // Restore saved position when book changes
  useEffect(() => {
    clearSaveTimer()

    if (bookId && userId) {
      const savedLocation = getPosition(bookId, userId)
      setLocation(savedLocation || 0)
    } else {
      setLocation(0)
    }

    pubsub.publish('closeContextMenu')
  }, [bookId, userId, getPosition])

  // Fetch book content
  useEffect(() => {
    const selectedBook = booksContext?.selectedBook
    let isMounted = true

    setBookLoadError(null)
    setIsLoadingBook(false)

    if (!selectedBook) {
      setBookBlobUrl(null)
      return
    }

    const isPublicUrl = selectedBook.url?.startsWith('/files/') ||
                        selectedBook.url?.startsWith('http')

    if (isPublicUrl) {
      setBookBlobUrl(selectedBook.url)
      return
    }

    if (!selectedBook.bookId) {
      setBookLoadError('Invalid book: missing bookId')
      return
    }

    const loadBookBlob = async () => {
      if (!isMounted) return

      setIsLoadingBook(true)
      setBookLoadError(null)
      setBookBlobUrl(null)

      try {
        const blob = await fetchBookContent(selectedBook.bookId)

        if (!isMounted) return

        const arrayBuffer = await blob.arrayBuffer()

        if (!isValidEpub(arrayBuffer)) {
          throw new Error('Invalid EPUB file format')
        }

        setBookBlobUrl(arrayBuffer)
        setIsLoadingBook(false)
      } catch (error: any) {
        if (!isMounted) return

        console.error('Failed to load book:', error)
        setBookLoadError(error.message || 'Failed to load book')

        if (selectedBook.url) {
          setBookBlobUrl(selectedBook.url)
        }
      } finally {
        if (isMounted) {
          setIsLoadingBook(false)
        }
      }
    }

    loadBookBlob()

    return () => {
      isMounted = false
    }
  }, [booksContext?.selectedBook?.bookId])

  // Handle text selection and highlighting
  useEffect(() => {
    if (!rendition.current) return

    let currentHighlight: string | null = null
    let currentContents: Contents | null = null

    const handleSelection = (cfiRange: string, contents: Contents) => {
      if (currentHighlight) {
        rendition.current?.annotations.remove(currentHighlight, 'highlight')
      }

      const selectedText = rendition.current?.getRange(cfiRange).toString()
      if (selectedText) {
        setHighlightedText(selectedText)

        rendition.current?.annotations.add(
          'highlight',
          cfiRange,
          {},
          () => {},
          'hl',
          { fill: '#03b1fc', 'fill-opacity': '0.5', 'mix-blend-mode': 'multiply' }
        )

        currentHighlight = cfiRange
        currentContents = contents

        showContextMenu(contents, selectedText, pubsub, bookTitle, bookAuthor)
      }
    }

    const handleMouseDown = () => {
      pubsub.publish('closeContextMenu')

      if (currentHighlight && rendition.current) {
        rendition.current.annotations.remove(currentHighlight, 'highlight')
        currentHighlight = null
        setHighlightedText('')
      }

      currentContents?.window.getSelection()?.removeAllRanges()
    }

    const handleResize = () => {
      pubsub.publish('closeContextMenu')
    }

    rendition.current.on('selected', handleSelection)
    rendition.current.on('mousedown', handleMouseDown)
    window.addEventListener('resize', handleResize)

    return () => {
      rendition.current?.off('selected', handleSelection)
      rendition.current?.off('mousedown', handleMouseDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [rendition.current, bookTitle, bookAuthor])

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => clearSaveTimer()
  }, [])

  const clearSaveTimer = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }

  const debouncedSavePosition = useCallback((loc: string | number) => {
    if (!bookId || !userId || loc === 0) return

    clearSaveTimer()

    saveTimerRef.current = window.setTimeout(() => {
      savePosition(bookId, userId, loc)
    }, 1000)
  }, [bookId, userId, savePosition])

  const handleLocationChange = (loc: string) => {
    setLocation(loc)
    debouncedSavePosition(loc)
  }

  const handleRenditionReady = (_rendition: Rendition) => {
    rendition.current = _rendition
    rendition.current.themes.fontSize(largeText ? '140%' : '100%')

    setupLocationGeneration(_rendition)
    setupErrorHandling(_rendition)

    // Apply theme immediately
    if (isDarkMode) {
      _rendition.themes.override('color', '#e5e5e5')
      _rendition.themes.override('background', '#000000')
    } else {
      _rendition.themes.override('color', '#000000')
      _rendition.themes.override('background', '#ffffff')
    }
  }

  const setupLocationGeneration = (rendition: Rendition) => {
    const book = rendition.book
    if (book && !book.locations?.length()) {
      book.locations.generate(150).then(() => {
        console.log('[Reader] Locations generated:', book.locations.length())
      }).catch((error: Error) => {
        console.error('[Reader] Failed to generate locations:', error)
      })
    }
  }

  const setupErrorHandling = (rendition: Rendition) => {
    rendition.on('displayError', (err: Error) => {
      console.error('[EPUB.js] Display error:', err)
      setBookLoadError(`Cannot display this EPUB: ${err.message}`)
      setIsLoadingBook(false)
    })

    rendition.on('rendered', () => {
      console.log('[EPUB.js] Page rendered successfully')
    })
  }

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
          <div style={{ fontSize: '14px', opacity: 0.7 }}>{bookTitle}</div>
        </div>
      </ReaderWrapper>
    )
  }

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
          <div style={{ fontSize: '18px', color: '#ff4444' }}>Failed to load book</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>{bookLoadError}</div>
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
        locationChanged={handleLocationChange}
        getRendition={handleRenditionReady}
        readerStyles={{
          ...ReactReaderStyle,
          readerArea: {
            ...ReactReaderStyle.readerArea,
            backgroundColor: isDarkMode ? '#000000' : '#ffffff',
          },
        }}
      />
      <ShareContextMenu />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ReaderWrapper>
  )
}

// Helper functions

function isValidEpub(arrayBuffer: ArrayBuffer): boolean {
  const view = new Uint8Array(arrayBuffer)
  return view[0] === 0x50 && view[1] === 0x4B // PK signature
}

function showContextMenu(
  contents: Contents,
  selectedText: string,
  pubsub: PubSub,
  bookTitle: string,
  bookAuthor: string
) {
  const selection = contents.window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const rangeRect = range.getBoundingClientRect()

  const iframe = document.querySelector('iframe')
  if (!iframe) return

  const iframeRect = iframe.getBoundingClientRect()

  pubsub.publish('showContextMenu', {
    x: iframeRect.left + rangeRect.left + (rangeRect.width / 2),
    y: iframeRect.top + rangeRect.bottom + 5,
    text: selectedText,
    bookTitle,
    bookAuthor
  })

  selection.removeAllRanges()
}

export default Reader
