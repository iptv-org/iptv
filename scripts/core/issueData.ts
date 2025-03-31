import { Dictionary } from '@freearhey/core'

export class IssueData {
  _data: Dictionary
  constructor(data: Dictionary) {
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

  getArray(key: string): string[] {
    const deleteSymbol = '~'

    return this._data.get(key) === deleteSymbol ? [] : this._data.get(key).split('\r\n')
  }
}
