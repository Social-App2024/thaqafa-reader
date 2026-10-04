'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { FaQuestionCircle } from 'react-icons/fa'
import { FaArrowRightFromBracket, FaCircleUser, FaGear } from 'react-icons/fa6'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { User } from '../../types/profile'

export default function ProfileBar({ profile }: { profile: User | undefined }) {
  const auth = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isArabic = i18n.language?.toLowerCase().startsWith('ar')

  const handleSignOut = async () => {
    await auth.signoutRedirect()
  }

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false)
    navigate(path)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 1023px)')

    const syncScrollLock = () => {
      if (isMenuOpen && mediaQuery.matches) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }

    syncScrollLock()
    mediaQuery.addEventListener('change', syncScrollLock)

    return () => {
      mediaQuery.removeEventListener('change', syncScrollLock)
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          className="relative"
          initial="initial"
          animate="visible"
          variants={{
            initial: {},
            visible: {},
          }}
        >
          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="profile-menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="relative flex items-center justify-center w-12 h-12 rounded-full border border-black/20 shadow-sm bg-white transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {profile.picture ? (
              // Handle actual valid profile link from backend or s3 storage equiv
              <img
                src={profile.picture}
                alt={t('navbar.profile_bar.profile_alt')}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              // handle default static profile picture
              <img
                src="/images/default_profile.png"
                alt={t('navbar.profile_bar.profile_alt')}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                id="profile-menu"
                className="fixed lg:absolute inset-x-0 top-16 bottom-0 lg:top-[calc(100%+0.75rem)] lg:bottom-auto lg:right-0 lg:left-auto lg:min-w-[220px] z-[80] h-[calc(100dvh-4rem)] lg:h-auto"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.35,
                    ease: 'easeOut',
                  },
                }}
                exit={{
                  opacity: 0,
                  y: -6,
                  scale: 0.97,
                  transition: {
                    duration: 0.15,
                    ease: 'easeIn',
                  },
                }}
              >
                <div className="h-full lg:h-auto bg-white/95 backdrop-blur-md lg:rounded-2xl shadow-2xl border border-black/10 flex flex-col p-5 lg:p-4 gap-3 overflow-y-auto">
                  <div className="lg:hidden mb-1 rounded-2xl border border-primary/20 bg-secondary/20 p-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => i18n.changeLanguage('en')}
                        className={`rounded-xl py-2 text-sm font-space font-semibold transition-colors ${!isArabic ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/60'}`}
                        aria-pressed={!isArabic}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => i18n.changeLanguage('ar')}
                        className={`rounded-xl py-2 text-sm font-space font-semibold transition-colors ${isArabic ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/60'}`}
                        aria-pressed={isArabic}
                      >
                        AR
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full text-left text-nowrap font-space text-base md:text-sm px-3 py-2 rounded-xl hover:bg-primary/10 transition-colors transition-transform duration-200 ease-out hover:translate-x-1 hover:scale-[1.01] flex items-center gap-3"
                    onClick={() => handleNavigate(`/profile/${profile.id}`)}
                  >
                    <FaCircleUser className="text-lg" />
                    {t('navbar.profile_bar.visit_profile')}
                  </button>
                  <button
                    type="button"
                    className="w-full text-left font-space text-base md:text-sm px-3 py-2 rounded-xl hover:bg-primary/10 transition-colors transition-transform duration-200 ease-out hover:translate-x-1 hover:scale-[1.01] flex items-center gap-3"
                    onClick={() => handleNavigate('/settings')}
                  >
                    <FaGear className="text-lg" />
                    {t('navbar.profile_bar.settings')}
                  </button>
                  <button
                    type="button"
                    className="w-full text-left font-space text-base md:text-sm px-3 py-2 rounded-xl hover:bg-primary/10 transition-colors transition-transform duration-200 ease-out hover:translate-x-1 hover:scale-[1.01] flex items-center gap-3"
                    onClick={() => handleNavigate('/faq')}
                  >
                    <FaQuestionCircle className="text-lg" />
                    {t('navbar.profile_bar.help')}
                  </button>
                  <button
                    type="button"
                    className="w-full text-left font-space text-base md:text-sm px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-600 transition-colors transition-transform duration-200 ease-out hover:translate-x-1 hover:scale-[1.01] flex items-center gap-3"
                    onClick={() => handleSignOut()}
                  >
                    <FaArrowRightFromBracket className="text-lg" />
                    {t('navbar.profile_bar.sign_out')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
