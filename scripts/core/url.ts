import normalizeUrl from 'normalize-url'

export class URL {
  url: string

  constructor(url: string) {
    this.url = url
  }

  normalize(): URL {
    const normalized = normalizeUrl(this.url, { stripWWW: false })
    this.url = decodeURIComponent(normalized).replace(/\s/g, '+')

    return this
  }

  toString(): string {
    return this.url
  }
}
