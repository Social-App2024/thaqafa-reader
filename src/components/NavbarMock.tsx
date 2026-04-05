import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useDarkMode } from '../data/darkModeProvider'
import { useTranslation } from 'react-i18next'

const LanguageButton = ({
  children,
  languageCode,
}: {
  children: ReactNode
  languageCode: string
}) => {
  const { i18n } = useTranslation()

  function changeLanguage() {
    console.log('[LanguageButton] Changing language to:', languageCode)
    i18n.changeLanguage(languageCode).then(() => {
      console.log('[LanguageButton] Language changed successfully to:', i18n.language)
      console.log('[LanguageButton] Current dir attribute:', document.documentElement.dir)
    })
  }

  return (
    <button
      className="py-2 px-3 font-semibold xl:text-lg font-poppins text-black
     transform hover:scale-[115%] transition-transform duration-300 hover:bg-primary
     hover:text-green-500 rounded-2xl"
      onClick={changeLanguage}
    >
      {children}
    </button>
  )
}

const NavbarCenterItem = ({
  children,
  link,
}: {
  children: ReactNode
  link: string
}) => {
  return (
    <NavLink
      to={link}
      className={
        'relative w-fit h-fit flex flex-col items-center justify-center p-2.5 transform hover:scale-[108%] transition-transform duration-400 hover:bg-primary rounded-2xl hover:text-green-500'
      }
    >
      {children}
    </NavLink>
  )
}

export default function NavBarMock() {
  const profile: { id: number; name: string } = { id: 4, name: 'testing' }
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { t } = useTranslation()

  return (
    <>
      <div className="flex w-full justify-between border-b-[1.5px] shadow-lg border-b-accent/60 items-center py-2.5">
        {/* Logo at the left */}
        <Link
          to="/"
          className="text-2xl lg:text-3xl font-poppins text-accent font-semibold px-10 w-1/4"
        >
          Thaqafa☀️
        </Link>
        <div className="hidden md:flex gap-x-6 px-10 font-space items-center">
          <NavbarCenterItem link={'/'}> {t('navbar.home')} </NavbarCenterItem>|
          <NavbarCenterItem link={'/discover'}> {t('navbar.discover')} </NavbarCenterItem>|
          <NavbarCenterItem link={'/people'}> {t('navbar.people')} </NavbarCenterItem>|
          <NavbarCenterItem link={'/selection'}> {t('navbar.selection')} </NavbarCenterItem>
        </div>
        <div className="flex items-center w-1/4 justify-end">
          <div className="hidden lg:flex px-10 font-space items-center justify-center ">
            {[
              { name: 'English', shorthand: 'EN', slug: 'en' },
              { name: 'Arabic', shorthand: 'AR', slug: 'ar' },
            ].map(({ shorthand, slug }, idx, arr) => {
              return (
                <div key={slug}>
                  <LanguageButton languageCode={slug}>{shorthand}</LanguageButton>
                  {idx !== arr.length - 1 && <span className="mx-4">|</span>}
                </div>
              )
            })}
          </div>
          {/* Dark Mode Toggle */}
          <div className="mr-4 flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleDarkMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          <div className="mr-4">
            {/* Profile Icon for Quick Access.. yippe */}
            <div className="h-8 w-8 border-2 border-green-500 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </>
  )
}
