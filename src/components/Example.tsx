import { type ReactNode } from 'react'

type Props = {
  title: string
  actions?: ReactNode
  above?: ReactNode
  children: ReactNode
}

export const Example = ({ title, actions, children, above = null }: Props) => {
  return (
    <div className="w-full grid grid-cols-1 gap-4">
      <div className="flex items-start gap-2 flex-wrap justify-between">
        <h1 className="h1 m-0 p-0">{title}</h1>
        {actions && (
          <div className="flex items-start flex-wrap gap-2 m-0 p-0">{actions}</div>
        )}
      </div>
      {above}
      <div className="md:aspect-video aspect-[3/4] w-full border border-stone-300 rounded overflow-hidden">
        {children}
      </div>
    </div>
  )
}
