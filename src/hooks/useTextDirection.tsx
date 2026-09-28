import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getTextDirection } from '../util/utils'

export default function useTextDirection() {
  const { i18n } = useTranslation()
  return useMemo(() => getTextDirection(i18n.language), [i18n.language])
}
