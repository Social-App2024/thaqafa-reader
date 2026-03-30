import { createContext, useContext, useCallback, useEffect, useRef, type ReactNode } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import {
  saveReadingPosition,
  getAllReadingPositions
} from '../api/readingPosition'

interface ReadingPosition {
  location: string | number
  currentPage?: number
  totalPages?: number
  timestamp: number
  syncStatus?: 'synced' | 'pending' | 'failed'
}

interface ReadingPositionsMap {
  [bookId: string]: ReadingPosition
}

interface ReadingPositionContextType {
  getPosition: (bookId: string) => ReadingPosition | null
  savePosition: (bookId: string, position: Omit<ReadingPosition, 'timestamp' | 'syncStatus'>) => void
  clearPosition: (bookId: string) => void
  getAllPositions: () => ReadingPositionsMap
  syncToBackend: () => Promise<void>
}

const ReadingPositionContext = createContext<ReadingPositionContextType | undefined>(undefined)

export const ReadingPositionProvider = ({ children }: { children: ReactNode }) => {
  const [positions, setPositions] = useLocalStorageState<ReadingPositionsMap>(
    'reading-positions',
    { defaultValue: {} }
  )

  const syncTimerRef = useRef<number | null>(null)
  const isSyncingRef = useRef(false)

  const getPosition = useCallback((bookId: string) => {
    return positions[bookId] || null
  }, [positions])

  const savePosition = useCallback((bookId: string, position: Omit<ReadingPosition, 'timestamp' | 'syncStatus'>) => {
    setPositions(prev => ({
      ...prev,
      [bookId]: {
        ...position,
        timestamp: Date.now(),
        syncStatus: 'pending'
      }
    }))
  }, [setPositions])

  const clearPosition = useCallback((bookId: string) => {
    setPositions(prev => {
      const updated = { ...prev }
      delete updated[bookId]
      return updated
    })
  }, [setPositions])

  const getAllPositions = useCallback(() => {
    return positions
  }, [positions])

  // Sync pending positions to backend
  const syncToBackend = useCallback(async () => {
    if (isSyncingRef.current) return

    isSyncingRef.current = true

    try {
      // Find all pending positions
      const pending = Object.entries(positions).filter(
        ([_, pos]) => pos.syncStatus === 'pending'
      )

      if (pending.length === 0) {
        isSyncingRef.current = false
        return
      }

      console.log('[Sync] Syncing', pending.length, 'positions to backend')

      // Sync each pending position
      const syncPromises = pending.map(async ([bookId, position]) => {
        try {
          await saveReadingPosition(bookId, position)

          // Mark as synced
          setPositions(prev => ({
            ...prev,
            [bookId]: { ...prev[bookId], syncStatus: 'synced' }
          }))
        } catch (error) {
          console.error('[Sync] Failed to sync position for', bookId, error)

          // Mark as failed
          setPositions(prev => ({
            ...prev,
            [bookId]: { ...prev[bookId], syncStatus: 'failed' }
          }))
        }
      })

      await Promise.allSettled(syncPromises)
      console.log('[Sync] Sync complete')
    } catch (error) {
      console.error('[Sync] Sync error:', error)
    } finally {
      isSyncingRef.current = false
    }
  }, [positions, setPositions])

  // Automatic sync on position changes (debounced 5 seconds)
  useEffect(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    // Check if there are pending positions
    const hasPending = Object.values(positions).some(
      pos => pos.syncStatus === 'pending'
    )

    if (hasPending) {
      syncTimerRef.current = window.setTimeout(() => {
        syncToBackend()
      }, 5000) // 5 second debounce
    }

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [positions, syncToBackend])

  // Initial sync on mount (merge backend with local)
  useEffect(() => {
    const initialSync = async () => {
      try {
        const backendPositions = await getAllReadingPositions()

        if (!backendPositions || Object.keys(backendPositions).length === 0) {
          console.log('[Sync] No backend positions found')
          return
        }

        // Merge with local positions (latest timestamp wins)
        setPositions(prev => {
          const merged = { ...prev }

          Object.entries(backendPositions).forEach(([bookId, backendPos]: [string, any]) => {
            const localPos = prev[bookId]

            if (!localPos || backendPos.timestamp > localPos.timestamp) {
              // Backend is newer or no local copy
              merged[bookId] = { ...backendPos, syncStatus: 'synced' }
            }
          })

          return merged
        })

        console.log('[Sync] Initial sync complete')
      } catch (error) {
        console.error('[Sync] Initial sync failed:', error)
        // Continue with local positions only
      }
    }

    initialSync()
  }, [setPositions]) // Only on mount

  // Sync on app focus/visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Sync] App became visible, syncing...')
        syncToBackend()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncToBackend])

  return (
    <ReadingPositionContext.Provider value={{
      getPosition,
      savePosition,
      clearPosition,
      getAllPositions,
      syncToBackend
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
