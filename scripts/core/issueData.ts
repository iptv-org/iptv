import { Dictionary } from '@freearhey/core'

export class IssueData {
  _data: Dictionary<string>
  constructor(data: Dictionary<string>) {
    this._data = data
  }

  has(key: string): boolean {
    return this._data.has(key)
  }

  missing(key: string): boolean {
    return this._data.missing(key) || this._data.get(key) === undefined
  }

  getBoolean(key: string): boolean {
    return Boolean(this._data.get(key))
  }

  getString(key: string): string | undefined {
    const deleteSymbol = '~'

    return this._data.get(key) === deleteSymbol ? '' : this._data.get(key)
  }

  getArray(key: string): string[] | undefined {
    const deleteSymbol = '~'

    if (this._data.missing(key)) return undefined

    const value = this._data.get(key)

    return !value || value === deleteSymbol ? [] : value.split('\r\n')
  }
}
