import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

const LanguageButton = ({
  children,
  name,
}: {
  children: ReactNode
  name: string
}) => {
  function changeLanguage() {
    console.log(`language changed to: ${name}`)
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
          <NavbarCenterItem link={'/'}> A </NavbarCenterItem>|
          <NavbarCenterItem link={'/discover'}> B </NavbarCenterItem>|
          <NavbarCenterItem link={'/people'}> C </NavbarCenterItem>|
          <NavbarCenterItem link={'/faq'}> D </NavbarCenterItem>
        </div>
        <div className="flex items-center w-1/4 justify-end">
          <div className="hidden lg:flex px-10 font-space items-center justify-center ">
            {[
              { name: 'English', shorthand: 'EN', slug: 'en' },
              { name: 'Arabic', shorthand: 'AR', slug: 'ar' },
            ].map(({ name, shorthand, slug }, idx, arr) => {
              return (
                <div key={slug}>
                  <LanguageButton name={name}>{shorthand}</LanguageButton>
                  {idx !== arr.length - 1 && <span className="mx-4">|</span>}
                </div>
              )
            })}
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
