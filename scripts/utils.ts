export function isURI(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}
