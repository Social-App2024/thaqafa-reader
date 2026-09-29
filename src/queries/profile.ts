import { queryOptions, useQuery } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import { fetchUserProfile } from '../api/userProfile'
import type { User } from '../types/profile'

// Five Minutes
const PROFILE_STALE_TIME = 1000 * 60 * 5
export const UserProfileQueryKey = (sub: string | undefined) => [
  'userProfile',
  sub,
]

export const UserProfileQueryOptions = (
  sub: string | undefined,
  access_token: string | undefined,
  enabled: boolean = true,
) =>
  queryOptions<User>({
    queryKey: UserProfileQueryKey(sub),
    queryFn: async () => await fetchUserProfile(access_token),
    staleTime: PROFILE_STALE_TIME,
    refetchOnWindowFocus: false,
  })

export function useUserProfile() {
  const auth = useAuth()

  return useQuery(
    UserProfileQueryOptions(
      auth.user?.profile.sub,
      auth.user?.access_token,
      !!auth.user,
    ),
  )
}
