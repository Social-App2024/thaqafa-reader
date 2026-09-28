import { useRef } from 'react'
import BooksList from '../../components/BooksList'
import Reader from '../../components/Reader'
import MainLayout from '../../components/MainLayout'

export default function Home() {
  const readerRef = useRef<HTMLDivElement>(null)
  return (
    <MainLayout>
      <div className="flex items-start gap-x-4 w-full">
        <div className="hidden md:block w-40 h-screen overflow-y-auto">
          <BooksList />
        </div>
        <div ref={readerRef} className="grow relative">
          <Reader />
        </div>
      </div>
    </MainLayout>
  )
}
