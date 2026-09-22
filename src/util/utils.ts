import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cssMerge = (...classes: ClassValue[]): string =>
  twMerge(clsx(...classes))

export type TextDirection = 'ltr' | 'rtl'

export const getTextDirection = (locale: unknown): TextDirection => {
  if (typeof locale !== 'string') return 'ltr'
  switch (locale.toLowerCase()) {
    case 'ar':
    case 'he':
    case 'fa':
    case 'ur':
    case 'yi':
    case 'ku':
      return 'rtl'
    default:
      return 'ltr'
  }
}
