import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FaArrowRightFromBracket, FaRegCircleUser } from 'react-icons/fa6'
import { useAuth } from 'react-oidc-context'
import { useTranslation } from 'react-i18next'

/**
 * Profile icon button with a dropdown menu holding the logout action,
 * mirroring Thaqafa-Frontend's ProfileBar (logout-only: the reader has
 * no profile/settings/faq routes).
 */
export default function ProfileBar() {
  const auth = useAuth()
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    setIsMenuOpen(false)
    await auth.signoutRedirect()
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isMenuOpen}
        aria-controls="profile-menu"
        aria-label={t('auth.account')}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-black transition-colors duration-200 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40"
      >
        <FaRegCircleUser className="text-[26px]" />
      </button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="profile-menu"
            className="absolute end-0 top-[calc(100%+0.5rem)] z-[80] min-w-[180px]"
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
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-black/10 flex flex-col p-2">
              <button
                type="button"
                className="w-full text-start font-poppins text-sm px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-600 transition-colors transition-transform duration-200 ease-out ltr:hover:translate-x-1 rtl:hover:-translate-x-1 flex items-center gap-3"
                onClick={handleSignOut}
              >
                <FaArrowRightFromBracket className="text-lg rtl:-scale-x-100" />
                {t('auth.logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
