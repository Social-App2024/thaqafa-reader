import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import { useAuth } from 'react-oidc-context'
import { fetchUserProfile } from '../api/userProfile'
import type { User } from '../types/profile'

// Fallback userId for offline mode or when API fails
const OFFLINE_USER_ID = '66b7a5025cf5d67e2eeaa1fb'

export const OFFLINE_PROFILE: User = {
  id: OFFLINE_USER_ID,
  userType: 'private',
  firstName: 'Offline',
  lastName: 'User',
  email: '',
  country: '',
  gender: undefined,
  profession: '',
  tags: [],
  picture: '',
  birthDate: new Date(1980, 0, 0),
  onboarded: false,
  description: undefined,
  portfolioPublic: false,
  createdAt: new Date(1980, 0, 0),
}

interface ProfileContextType {
  profile: User | null
  userId: string
  isLoading: boolean
  error: string | null
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()
  const accessToken = auth.user?.access_token
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)

      if (!auth.isAuthenticated || !accessToken) {
        setProfile(OFFLINE_PROFILE)
        setIsLoading(false)
        return
      }

      try {
        const userProfile = (await fetchUserProfile(accessToken)) as User
        if (cancelled) return

        console.log('[Profile] User profile loaded:', userProfile.id)
        setProfile(userProfile)
      } catch (err: any) {
        if (cancelled) return

        console.warn(
          '[Profile] Failed to load user profile, using offline userId:',
          err.message,
        )
        setError(err.message || 'Failed to load profile')
        setProfile(OFFLINE_PROFILE)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [auth.isAuthenticated, accessToken])

  const contextValue = useMemo(
    () => ({
      profile,
      userId: profile?.id || OFFLINE_USER_ID,
      isLoading,
      error,
    }),
    [profile, isLoading, error],
  )

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  return context
}
