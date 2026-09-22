import { authApi } from './client'

export async function ViewPurchasedBooks() {
  const { data } = await authApi.get('/reader/purchased-books')
  if (!data) throw new Error('Failed to fetch books list.')
  return data
}
