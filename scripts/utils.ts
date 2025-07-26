import validUrl from 'valid-url'

export function isURI(string: string) {
  return validUrl.isUri(encodeURI(string))
}
