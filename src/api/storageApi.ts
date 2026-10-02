const AZURITE = /^(?:https?:\/\/)?(?:127\.0\.0\.1|localhost):10000/i

export const storageUrl = (url: string | undefined) =>
  url ? url.replace(AZURITE, '/storage') : url
