import { createContext, useContext, useCallback, useEffect, useRef, type ReactNode } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import {
  saveReadingPosition,
  getAllReadingPositions
} from '../api/readingPosition'
import { useProfile } from './profileProvider'

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

// Nested structure: userId -> bookId -> position
interface UserReadingPositions {
  [userId: string]: ReadingPositionsMap
}

interface ReadingPositionContextType {
  getPosition: (bookId: string, userId: string) => ReadingPosition | null
  savePosition: (bookId: string, userId: string, position: Omit<ReadingPosition, 'timestamp' | 'syncStatus'>) => void
  clearPosition: (bookId: string, userId: string) => void
  getAllPositions: (userId: string) => ReadingPositionsMap
  syncToBackend: (userId: string) => Promise<void>
}

const ReadingPositionContext = createContext<ReadingPositionContextType | undefined>(undefined)

export const ReadingPositionProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useProfile()
  const [allPositions, setAllPositions] = useLocalStorageState<UserReadingPositions>(
    'reading-positions',
    { defaultValue: {} }
  )

  const syncTimerRef = useRef<number | null>(null)
  const isSyncingRef = useRef(false)

  const getPosition = useCallback((bookId: string, userId: string) => {
    return allPositions[userId]?.[bookId] || null
  }, [allPositions])

  const savePosition = useCallback((bookId: string, userId: string, position: Omit<ReadingPosition, 'timestamp' | 'syncStatus'>) => {
    setAllPositions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [bookId]: {
          ...position,
          timestamp: Date.now(),
          syncStatus: 'pending'
        }
      }
    }))
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

  const getAllPositions = useCallback((userId: string) => {
    return allPositions[userId] || {}
  }, [allPositions])

  // Sync pending positions to backend for a specific user
  const syncToBackend = useCallback(async (userId: string) => {
    if (isSyncingRef.current) return

    isSyncingRef.current = true

    try {
      const userPositions = allPositions[userId] || {}

      // Find all pending positions for this user
      const pending = Object.entries(userPositions).filter(
        ([_, pos]) => pos.syncStatus === 'pending'
      )

      if (pending.length === 0) {
        isSyncingRef.current = false
        return
      }

      console.log('[Sync] Syncing', pending.length, 'positions to backend for user:', userId)

      // Sync each pending position
      const syncPromises = pending.map(async ([bookId, position]) => {
        try {
          await saveReadingPosition(bookId, position)

          // Mark as synced
          setAllPositions(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              [bookId]: { ...prev[userId][bookId], syncStatus: 'synced' }
            }
          }))
        } catch (error) {
          console.error('[Sync] Failed to sync position for', bookId, error)

          // Mark as failed
          setAllPositions(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              [bookId]: { ...prev[userId][bookId], syncStatus: 'failed' }
            }
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
  }, [allPositions, setAllPositions])

  // Automatic sync on position changes (debounced 5 seconds)
  // Sync all users with pending positions
  useEffect(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    // Check if there are any pending positions across all users
    const userIdsWithPending = Object.entries(allPositions)
      .filter(([_, positions]) =>
        Object.values(positions).some(pos => pos.syncStatus === 'pending')
      )
      .map(([userId]) => userId)

    if (userIdsWithPending.length > 0) {
      syncTimerRef.current = window.setTimeout(() => {
        // Sync all users with pending positions
        userIdsWithPending.forEach(userId => {
          syncToBackend(userId)
        })
      }, 5000) // 5 second debounce
    }

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [allPositions, syncToBackend])

  // Initial sync on mount (merge backend with local for current user)
  useEffect(() => {
    if (!userId) return // Wait for userId to be loaded

    const initialSync = async () => {
      try {
        console.log('[Sync] Starting initial sync for user:', userId)
        const backendPositions = await getAllReadingPositions()

        if (!backendPositions || Object.keys(backendPositions).length === 0) {
          console.log('[Sync] No backend positions found for user:', userId)
          return
        }

        // Backend returns { bookId: position } format for this user
        // Merge with local positions (latest timestamp wins)
        setAllPositions(prev => {
          const merged = { ...prev }

          if (!merged[userId]) {
            merged[userId] = {}
          }

          Object.entries(backendPositions).forEach(([bookId, backendPos]: [string, any]) => {
            const localPos = merged[userId][bookId]

            if (!localPos || backendPos.timestamp > localPos.timestamp) {
              // Backend is newer or no local copy
              merged[userId][bookId] = { ...backendPos, syncStatus: 'synced' }
            }
          })

          return merged
        })

        console.log('[Sync] Initial sync complete for user:', userId)
      } catch (error) {
        console.error('[Sync] Initial sync failed:', error)
        // Continue with local positions only
      }
    }

    initialSync()
  }, [userId, setAllPositions]) // Sync when userId is available

  // Sync on app focus/visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Sync] App became visible, syncing...')

        // Sync all users with data
        Object.keys(allPositions).forEach(userId => {
          syncToBackend(userId)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [allPositions, syncToBackend])

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
