import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { cssMerge } from '../util/utils'
import { useTranslation } from 'react-i18next'
import Header from './layout/Header'
import useTextDirection from '../hooks/useTextDirection'

const NavbarCenterItem = ({
  children,
  link,
}: PropsWithChildren<{ link: string }>) => {
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

export default function MainLayout({
  children,
  sidebarVisible = true,
  suggestionbarVisible = true,
}: PropsWithChildren<{
  sidebarVisible?: boolean
  suggestionbarVisible?: boolean
}>) {
  const dir = useTextDirection()

  return (
    <>
      <Header />
      <div
        className={cssMerge(
          'relative flex h-full',
          dir === 'rtl' ? 'flex-row-reverse' : '',
        )}
      >
        <div className="grow xl:mx-5">{children}</div>
      </div>
    </>
  )
}
