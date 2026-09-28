import { useTranslation } from 'react-i18next'

type Language = {
  slug: string
  name: string
  display: string
}

const SUPPORTED_LANGUAGES: Record<string, Language> = {
  en: {
    slug: 'en',
    name: 'English',
    display: 'EN',
  },
  ar: {
    slug: 'ar',
    name: 'Arabic',
    display: 'AR',
  },
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation('common')
  const languages = Object.values(SUPPORTED_LANGUAGES)
  const activeIsArabic = i18n.language?.toLowerCase().startsWith('ar')

  return (
    <div className="hidden lg:flex px-6 xl:px-10 items-center justify-center">
      <div className="rounded-2xl border border-primary/20 bg-secondary/20 p-1.5 shadow-sm">
        <div className="grid grid-cols-2 gap-1.5 min-w-[132px]">
          {languages.map((l) => {
            const isActive = l.slug === 'ar' ? activeIsArabic : !activeIsArabic
            return <LanguageButton key={l.slug} lang={l} isActive={isActive} />
          })}
        </div>
      </div>
    </div>
  )
}

interface LanguageButtonProps {
  lang: Language
  isActive: boolean
}

function LanguageButton({ lang, isActive }: LanguageButtonProps) {
  const { i18n } = useTranslation('common')

  return (
    <button
      className={`rounded-xl px-3 py-2 text-sm xl:text-base font-space font-semibold transition-all duration-200 ${isActive
          ? 'bg-white text-primary shadow-sm'
          : 'text-gray-600 hover:bg-white/60 hover:text-primary'
        }`}
      onClick={() => i18n.changeLanguage(lang.slug)}
      aria-pressed={isActive}
    >
      {lang.display}
    </button>
  )
}
