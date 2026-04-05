import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './localization/en.json'
import ar from './localization/ar.json'

// Get the saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      ar: {
        translation: ar
      }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  })

// Update HTML dir attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
  localStorage.setItem('language', lng)
})

// Set initial dir attribute
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr'
document.documentElement.lang = savedLanguage

export default i18n
