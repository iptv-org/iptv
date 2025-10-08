import normalizeUrl from 'normalize-url'

export function isURI(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

export function normalizeURL(url: string): string {
  const normalized = normalizeUrl(url, { stripWWW: false })

  return decodeURIComponent(normalized).replace(/\s/g, '+').toString()
}

export function truncate(string: string, limit: number = 100) {
  if (!string) return string
  if (string.length < limit) return string

  return string.slice(0, limit - 3) + '...'
}
