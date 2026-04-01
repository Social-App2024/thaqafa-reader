import { createContext, useContext, useCallback, useEffect, type ReactNode } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { saveReadingPosition, getAllReadingPositions } from '../api/readingPosition'
import { useProfile } from './profileProvider'

interface ReadingPosition {
  location: string | number
  timestamp: number
}

interface ReadingPositionsMap {
  [bookId: string]: ReadingPosition
}

// Nested structure: userId -> bookId -> position
interface UserReadingPositions {
  [userId: string]: ReadingPositionsMap
}

interface ReadingPositionContextType {
  getPosition: (bookId: string, userId: string) => string | number | null
  savePosition: (bookId: string, userId: string, location: string | number) => void
  clearPosition: (bookId: string, userId: string) => void
}

const ReadingPositionContext = createContext<ReadingPositionContextType | undefined>(undefined)

export const ReadingPositionProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useProfile()
  const [allPositions, setAllPositions] = useLocalStorageState<UserReadingPositions>(
    'reading-positions',
    { defaultValue: {} }
  )

  const getPosition = useCallback((bookId: string, userId: string) => {
    return allPositions[userId]?.[bookId]?.location || null
  }, [allPositions])

  const savePosition = useCallback((bookId: string, userId: string, location: string | number) => {
    if (!bookId || location === 0) return

    const newPosition: ReadingPosition = {
      location,
      timestamp: Date.now()
    }

    setAllPositions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [bookId]: newPosition
      }
    }))

    // Save to backend immediately (no complex sync logic)
    saveReadingPosition(bookId, newPosition).catch(error => {
      console.error('[ReadingPosition] Failed to sync to backend:', error)
    })
  }, [setAllPositions])

  const clearPosition = useCallback((bookId: string, userId: string) => {
    setAllPositions(prev => {
      const updated = { ...prev }
      if (updated[userId]) {
        delete updated[userId][bookId]
        // Clean up empty user entries
        if (Object.keys(updated[userId]).length === 0) {
          delete updated[userId]
        }
      }
      return updated
    })
  }, [setAllPositions])

  // Load positions from backend on mount
  useEffect(() => {
    if (!userId) return

    const loadBackendPositions = async () => {
      try {
        const backendPositions = await getAllReadingPositions()

        if (!backendPositions || Object.keys(backendPositions).length === 0) {
          return
        }

        setAllPositions(prev => {
          const merged = { ...prev }

          if (!merged[userId]) {
            merged[userId] = {}
          }

          Object.entries(backendPositions).forEach(([bookId, backendPos]: [string, any]) => {
            const localPos = merged[userId][bookId]

            // Backend wins if newer or no local copy exists
            if (!localPos || backendPos.timestamp > localPos.timestamp) {
              merged[userId][bookId] = {
                location: backendPos.location,
                timestamp: backendPos.timestamp
              }
            }
          })

          return merged
        })
      } catch (error) {
        console.error('[ReadingPosition] Failed to load from backend:', error)
      }
    }

    loadBackendPositions()
  }, [userId, setAllPositions])

  return (
    <ReadingPositionContext.Provider value={{
      getPosition,
      savePosition,
      clearPosition
    }}>
      {children}
    </ReadingPositionContext.Provider>
  )
}

export const useReadingPosition = () => {
  const context = useContext(ReadingPositionContext)
  if (!context) {
    throw new Error('useReadingPosition must be used within ReadingPositionProvider')
  }
  return context
}
