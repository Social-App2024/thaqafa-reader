import type { Tag } from './tag'

export type BookMetadata = {
  bookId: string
  title: string
  url: string
  frontCoverUrl: string
  author: string
  desc?: string
  isRTL: boolean
  tags?: Tag[]
}
