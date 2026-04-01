import { useEffect } from 'react'
import type { Rendition } from 'epubjs'
import { useDarkMode } from '../data/darkModeProvider'

export const useReaderTheme = (rendition: Rendition | undefined, largeText: boolean) => {
  const { isDarkMode } = useDarkMode()

  // Apply font size
  useEffect(() => {
    rendition?.themes.fontSize(largeText ? '140%' : '100%')
  }, [rendition, largeText])

  // Apply color theme
  useEffect(() => {
    if (!rendition) return

    if (isDarkMode) {
      rendition.themes.override('color', '#e5e5e5')
      rendition.themes.override('background', '#000000')
    } else {
      rendition.themes.override('color', '#000000')
      rendition.themes.override('background', '#ffffff')
    }
  }, [rendition, isDarkMode])

  return { isDarkMode }
}
