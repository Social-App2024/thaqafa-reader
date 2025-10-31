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
  const [shareDialog, setShareDialog] = useState<{ imageUrl: string; text: string } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
  const bookAuthor = booksContext?.selectedBook?.author || 'Unknown Author'

  const generateShareImage = (text: string, title: string, author: string): string => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return ''

    // Set canvas width
    canvas.width = 800
    const padding = 60
    const contentWidth = canvas.width - (padding * 2)

    // Font sizes matching original book proportions (smaller, book-like sizes)
    const quoteFontSize = 18 // Main text size (similar to book text)
    const titleFontSize = 14 // Book title (proportional ratio preserved)
    const authorFontSize = 12 // Author name (proportional ratio preserved)
    const quotationMarkSize = 40 // Decorative quote (proportional ratio preserved)

    // Calculate required height based on text
    ctx.font = `bold ${quoteFontSize}px Arial`
    const words = text.split(' ')
    let line = ''
    let lineCount = 0
    const lineHeight = quoteFontSize * 1.6 // Line height proportional to font size

    // Count lines needed
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)

      if (metrics.width > contentWidth && i > 0) {
        lineCount++
        line = words[i] + ' '
      } else {
        line = testLine
      }
    }
    lineCount++ // Add the last line

    // Calculate dynamic height
    const topPadding = 80
    const bottomPadding = 100
    canvas.height = topPadding + (lineCount * lineHeight) + bottomPadding

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#03b1fc')
    gradient.addColorStop(1, '#0277bd')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw decorative quote marks
    ctx.font = `bold ${quotationMarkSize}px Georgia`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillText('"', padding - 10, 60)

    // Draw quote text
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${quoteFontSize}px Arial`
    ctx.textAlign = 'left'

    // Word wrap the text
    line = ''
    let y = topPadding

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)

      if (metrics.width > contentWidth && i > 0) {
        ctx.fillText(line, padding, y)
        line = words[i] + ' '
        y += lineHeight
      } else {
        line = testLine
      }
    }

    ctx.fillText(line, padding, y)

    // Draw book info
    y += 50
    ctx.fillStyle = '#ffffff'
    ctx.font = `italic ${titleFontSize}px Arial`
    ctx.fillText(`— ${title}`, padding, y)

    ctx.font = `${authorFontSize}px Arial`
    ctx.fillText(`by ${author}`, padding, y + 22)

    return canvas.toDataURL('image/png')
  }

  const handleShare = () => {
    if (contextMenu?.text) {
      console.log(`shared text: ${contextMenu.text}`)

      // Generate share image
      const imageUrl = generateShareImage(contextMenu.text, bookTitle, bookAuthor)

      // Show dialog with image
      setShareDialog({
        imageUrl,
        text: contextMenu.text
      })
    }

    setContextMenu(null)
  }

  const closeShareDialog = () => {
    setShareDialog(null)
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

      {shareDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeShareDialog}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-4 max-w-3xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-800">Share Quote</h2>
              <button
                onClick={closeShareDialog}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="mb-3">
              <img
                src={shareDialog.imageUrl}
                alt="Share quote"
                className="w-full rounded-lg shadow-md"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.download = 'quote.png'
                  link.href = shareDialog.imageUrl
                  link.click()
                }}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Share
              </button>
              <button
                onClick={closeShareDialog}
                className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ReaderWrapper>
  )
}

export default Reader
