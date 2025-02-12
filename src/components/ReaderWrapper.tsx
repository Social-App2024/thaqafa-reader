import type { ReactNode } from 'react'

const ReaderWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="md:aspect-video aspect-[3/4] w-full border border-stone-300 rounded overflow-hidden">
      {children}
    </div>
  )
}

export default ReaderWrapper
