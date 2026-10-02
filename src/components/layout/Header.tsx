import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { FaBook, FaMagnifyingGlass, FaUser } from 'react-icons/fa6'
import { FaHome } from 'react-icons/fa'
import ProfileBar from './ProfileBar'
import { cssMerge } from '../../util/utils'
import { useUserProfile } from '../../queries/profile'
import type { PropsWithChildren } from 'react'

interface NavbarCenterItemProps {
  link: string
}

const NavbarCenterItem = ({
  children,
  link,
}: PropsWithChildren<NavbarCenterItemProps>) => {
  return (
    <NavLink
      to={link}
      className={({ isActive }) =>
        cssMerge(
          'relative w-fit h-fit flex flex-col items-center justify-center p-2.5 transform hover:scale-[108%] transition-transform duration-400 hover:bg-primary rounded-2xl hover:text-white',
          isActive ? 'text-primary' : 'text-gray-600',
        )
      }
    >
      {children}
    </NavLink>
  )
}

export default function Header() {
  // Fetch profile data and feed it to whatever child component needs it.
  const { data, isLoading } = useUserProfile()
  // Should also handle selected route.. that being said, not really a priority considering this will only show a very small number of popular routes (4 for now)
  const { t, i18n } = useTranslation('common')
  const locale = i18n.language

  return (
    <>
      <div className="block lg:hidden h-16" />
      <div
        className={cssMerge(
          'flex w-full justify-between border-b-[1.5px] shadow-lg border-b-accent/60 items-center pt-3 pb-2 px-6 md:px-10',
          'fixed lg:sticky top-0 left-0 right-0 z-[70] bg-white/95 backdrop-blur-md',
          locale === 'ar' ? 'flex-row-reverse' : '',
        )}
      >
        {/* Logo at the left */}
        <Link
          to="/"
          className={cssMerge(
            'w-1/4 text-start',
            locale === 'ar' ? 'text-end' : '',
          )}
        >
          <img
            src="/images/logo.png"
            alt={t('platform_name')}
            className="inline-block h-10 w-auto lg:h-12"
          />
        </Link>
        <div className="hidden md:flex gap-x-7 font-space items-center">
          <NavbarCenterItem link={'/'}>
            {' '}
            <div className="inline-block text-[32px]">
              <FaHome />
            </div>
          </NavbarCenterItem>
          ￼￼ |
          <NavbarCenterItem link={'/discover'}>
            {' '}
            <div className="inline-block text-[28px]">
              <FaBook />
            </div>
          </NavbarCenterItem>
          |{/* <NavbarCenterItem link={'/people'}> */}
          {/*   {' '} */}
          {/*   <div className="inline-block text-[28px]"> */}
          {/*     <FaUser /> */}
          {/*   </div> */}
          {/* </NavbarCenterItem> */}
          <NavbarCenterItem link={'/frontend/search'}>
            {' '}
            <div className="inline-block text-[28px]">
              <FaMagnifyingGlass />
            </div>
          </NavbarCenterItem>
        </div>
        <div
          className={cssMerge(
            'flex items-center w-1/4 justify-end',
            locale === 'ar' ? 'flex-row-reverse' : '',
          )}
        >
          <LanguageSwitcher />
          <ProfileBar profile={data} />
        </div>
      </div>
    </>
  )
}
