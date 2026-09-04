import { Dictionary } from '@freearhey/core'

export class DataSet {
  _data: Dictionary<string>
  constructor(data: Dictionary<string>) {
    this._data = data
  }

  has(key: string): boolean {
    return this._data.has(key)
  }

  missing(key: string): boolean {
    const keys = Array.isArray(key) ? key : [key]

    return keys.every(_key => this._data.get(_key) === undefined)
  }

  isDeleted(key: string): boolean {
    const deleteSymbol = '~'

    return this._data.get(key) === deleteSymbol
  }

  getBoolean(key: string): boolean | undefined {
    const value = this._data.get(key)

    if (value === undefined || value === '') return undefined

    return value === 'TRUE'
  }

  getString(key: string): string | undefined {
    return this._data.get(key)
  }

  getArray(key: string): string[] | undefined {
    if (this._data.missing(key)) return undefined

    const value = this._data.get(key)

    return !value || this.isDeleted(key) ? [] : value.split('\r\n')
  }
}
