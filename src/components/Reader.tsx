import { useState, useRef, useEffect } from 'react'
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

export function Reader() {
  const booksContext = useBooks() as any
  const { isDarkMode } = useDarkMode()
  const { userId } = useProfile()
  const { getPosition, savePosition } = useReadingPosition()
  const rendition = useRef<Rendition | undefined>(undefined)
  const [location, setLocation] = useState<string | number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pubsub = usePubSub()
  const saveTimerRef = useRef<number | null>(null)
  const textSelectionCleanupRef = useRef<(() => void) | null>(null)
  const [bookBlobUrl, setBookBlobUrl] = useState<string | ArrayBuffer | null>(null)
  const [isLoadingBook, setIsLoadingBook] = useState(false)
  const [bookLoadError, setBookLoadError] = useState<string | null>(null)

  const bookId = booksContext?.selectedBook?.bookId
  const bookUrl = bookBlobUrl || booksContext?.selectedBook?.url || DEMO_URL
  const bookTitle = booksContext?.selectedBook?.title || DEMO_NAME
  const bookAuthor = booksContext?.selectedBook?.author || 'Unknown Author'

  function clearSaveTimer() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }

  function applyTheme(rendition: Rendition, isDark: boolean) {
    if (isDark) {
      rendition.themes.override('color', '#e5e5e5')
      rendition.themes.override('background', '#000000')
    } else {
      rendition.themes.override('color', '#000000')
      rendition.themes.override('background', '#ffffff')
    }
  }

  // Sync with external system: fetch book content from API
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

    async function loadBookBlob() {
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

  // Adjust state when book changes - restore saved position
  useEffect(() => {
    clearSaveTimer()

    const savedLocation = (bookId && userId) ? getPosition(bookId, userId) : null
    setLocation(savedLocation || 0)

    pubsub.publish('closeContextMenu')
  }, [bookId, userId, getPosition, pubsub])

  // Sync with external system: epub.js rendition theme
  useEffect(() => {
    if (rendition.current) {
      applyTheme(rendition.current, isDarkMode)
    }
  }, [isDarkMode])

  // Sync with external system: window resize event
  useEffect(() => {
    function handleResize() {
      pubsub.publish('closeContextMenu')
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearSaveTimer()
    }
  }, [pubsub])

  // Cleanup text-selection polling on unmount
  useEffect(() => {
    return () => {
      textSelectionCleanupRef.current?.()
      textSelectionCleanupRef.current = null
    }
  }, [])

  function handleLocationChange(loc: string) {
    setLocation(loc)

    if (!bookId || !userId) return

    clearSaveTimer()

    saveTimerRef.current = window.setTimeout(() => {
      savePosition(bookId, userId, loc)
    }, 1000)
  }

  function handleRenditionReady(_rendition: Rendition) {
    rendition.current = _rendition

    // Apply initial theme
    applyTheme(_rendition, isDarkMode)

    setupLocationGeneration(_rendition)
    setupErrorHandling(_rendition)
    textSelectionCleanupRef.current?.()
    textSelectionCleanupRef.current = setupTextSelection(_rendition, pubsub, bookTitle, bookAuthor)
  }

  function setupLocationGeneration(rendition: Rendition) {
    const book = rendition.book
    if (book && !book.locations?.length()) {
      book.locations.generate(150).then(() => {
        console.log('[Reader] Locations generated:', book.locations.length())
      }).catch((error: Error) => {
        console.error('[Reader] Failed to generate locations:', error)
      })
    }
  }

  function setupErrorHandling(rendition: Rendition) {
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

function setupTextSelection(
  rendition: Rendition,
  pubsub: PubSub,
  bookTitle: string,
  bookAuthor: string
): () => void {
  let currentHighlight: string | null = null
  let currentContents: Contents | null = null

  // WebKit/Safari blocks every event-listener callback registered on the
  // sandboxed epub iframe document (sandbox without 'allow-scripts'), so
  // epub.js' 'selected' and 'mousedown' events never fire there — unlike
  // Chrome/Firefox, which run listeners registered from the parent realm.
  // DOM and Selection APIs still work cross-realm, so on affected browsers we
  // poll the iframe selection from the parent context instead.
  const listenersBlocked = sandboxedIframeListenersBlocked()

  const handleSelection = (cfiRange: string, contents: Contents) => {
    if (currentHighlight) {
      rendition.annotations.remove(currentHighlight, 'highlight')
    }

    const selectedText = rendition.getRange(cfiRange).toString()

    rendition.annotations.add(
      'highlight',
      cfiRange,
      {},
      () => {},
      'hl',
      { fill: '#03b1fc', 'fill-opacity': '0.5', 'mix-blend-mode': 'multiply' }
    )

    currentHighlight = cfiRange
    currentContents = contents

    // Get the actual bounding rectangle of the selected text from the iframe content
    const selection = contents.window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const rangeRect = range.getBoundingClientRect()

      console.log('[handleSelection] rangeRect from selection:', {
        left: rangeRect.left,
        right: rangeRect.right,
        top: rangeRect.top,
        bottom: rangeRect.bottom,
        width: rangeRect.width,
        height: rangeRect.height
      })

      // Get iframe position on the page
      const iframe = document.querySelector('iframe')
      if (iframe) {
        const iframeRect = iframe.getBoundingClientRect()

        console.log('[handleSelection] iframeRect:', {
          left: iframeRect.left,
          top: iframeRect.top,
          width: iframeRect.width,
          height: iframeRect.height
        })

        const x = iframeRect.left + rangeRect.left + (rangeRect.width / 2)
        const y = iframeRect.top + rangeRect.bottom + 5

        console.log('[handleSelection] Publishing position:', { x, y })

        // Publish event to show context menu
        pubsub.publish('showContextMenu', {
          x,
          y,
          text: selectedText,
          bookTitle,
          bookAuthor
        })
      }
    }

    // When listeners are blocked (Safari) the selection must be kept: the
    // polling below detects its collapse as the 'dismiss menu' signal,
    // replacing the 'mousedown' relay that WebKit never delivers.
    if (!listenersBlocked) {
      selection?.removeAllRanges()
    }
  }

  const handleMouseDown = () => {
    pubsub.publish('closeContextMenu')

    if (currentHighlight) {
      rendition.annotations.remove(currentHighlight, 'highlight')
      currentHighlight = null
    }

    if (currentContents) {
      currentContents.window.getSelection()?.removeAllRanges()
    }
  }

  rendition.on('selected', handleSelection)
  rendition.on('mousedown', handleMouseDown)

  // Fallback for browsers where the iframe listeners are blocked (Safari):
  // poll the selection and replay it through the same handler.
  let pollTimer: number | null = null

  if (listenersBlocked) {
    let lastSelectedCfi: string | null = null
    let pendingCfi: string | null = null

    pollTimer = window.setInterval(() => {
      try {
        const contentsList = rendition.getContents?.() as unknown as Contents[] | undefined
        const contents = contentsList?.[0]
        const selection = contents?.window?.getSelection?.()
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

        if (contents && selection && range && !range.collapsed) {
          let cfiRange: string | null = null
          try {
            cfiRange = contents.cfiFromRange(range)
          } catch {
            cfiRange = null
          }

          if (cfiRange && cfiRange !== lastSelectedCfi && cfiRange !== pendingCfi) {
            // New selection — wait one more tick so mid-drag changes settle
            // (mirrors epub.js' 250ms selectionchange debounce in Chrome)
            pendingCfi = cfiRange
          } else if (cfiRange && cfiRange === pendingCfi) {
            pendingCfi = null
            lastSelectedCfi = cfiRange
            handleSelection(cfiRange, contents)
          }
        } else {
          pendingCfi = null

          if (lastSelectedCfi) {
            // Selection collapsed or vanished (click away / page turn):
            // dismiss the menu, replacing the undelivered 'mousedown'
            lastSelectedCfi = null
            handleMouseDown()
          }
        }
      } catch {
        // rendition torn down mid-poll, etc. — ignore
      }
    }, 300)
  }

  return () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }
}

// Detect whether event listeners registered from this (parent) context run on
// a sandboxed iframe document. WebKit/Safari blocks them (treating listener
// callbacks as script execution in the frame); Chrome/Firefox allow them.
function sandboxedIframeListenersBlocked(): boolean {
  let blocked = false
  const iframe = document.createElement('iframe')
  iframe.setAttribute('sandbox', 'allow-same-origin')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)

  try {
    const doc = iframe.contentDocument
    if (!doc) return false
    doc.open()
    doc.write('<p>probe</p>')
    doc.close()

    let listenerRan = false
    doc.addEventListener('probe', () => {
      listenerRan = true
    })
    doc.dispatchEvent(new Event('probe'))
    blocked = !listenerRan
  } catch {
    blocked = false
  } finally {
    iframe.remove()
  }

  return blocked
}

export default Reader
