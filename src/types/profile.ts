import type { Tag } from './tag'
export type UserType = 'private' | 'publisher'

export type PublicUserInformation = {
  id: string
  userType: UserType
  firstName: string
  lastName: string
  country: string
  gender?: string
  profession?: string
  tags: Tag[]
  picture: string
  birthDate: Date
  description: string
}

export type User = PublicUserInformation & {
  email: string
  onboarded: boolean
  portfolioPublic: boolean
  createdAt: Date
}

export type VisitedProfile = PublicUserInformation & {
  followsViewer: boolean
  followedByViewer: boolean
  blockedByViewer: boolean
}
