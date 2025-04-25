import type { LanguageData, LanguageSerializedData } from '../types/language'

export class Language {
  code: string
  name: string

  constructor(data?: LanguageData) {
    if (!data) return

    this.code = data.code
    this.name = data.name
  }

  serialize(): LanguageSerializedData {
    return {
      code: this.code,
      name: this.name
    }
  }

  deserialize(data: LanguageSerializedData): this {
    this.code = data.code
    this.name = data.name

    return this
  }
}
