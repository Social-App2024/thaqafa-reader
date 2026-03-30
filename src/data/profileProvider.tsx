import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import { fetchUserProfile } from '../api/userProfile'

// Fallback userId for offline mode or when API fails
const OFFLINE_USER_ID = '66b7a5025cf5d67e2eeaa110'

interface UserProfile {
  id: string
  userType: string
  firstName: string
  lastName: string
  email: string
  country: string
  gender: string | null
  profession: string
  tags: any
  picture: string
  birthDate: string | null
  onboarded: boolean
  description: string | null
  createdAt: string | null
}

interface ProfileContextType {
  profile: UserProfile | null
  userId: string
  isLoading: boolean
  error: string | null
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const userProfile = await fetchUserProfile()

        console.log('[Profile] User profile loaded:', userProfile.id)
        setProfile(userProfile)
      } catch (err: any) {
        console.warn('[Profile] Failed to load user profile, using offline userId:', err.message)
        setError(err.message || 'Failed to load profile')

        // Set fallback profile with offline userId
        setProfile({
          id: OFFLINE_USER_ID,
          userType: 'offline',
          firstName: 'Offline',
          lastName: 'User',
          email: '',
          country: '',
          gender: null,
          profession: '',
          tags: null,
          picture: '',
          birthDate: null,
          onboarded: false,
          description: null,
          createdAt: null
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const contextValue = useMemo(() => ({
    profile,
    userId: profile?.id || OFFLINE_USER_ID,
    isLoading,
    error
  }), [profile, isLoading, error])

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
