type LanguageData = {
  code: string
  name: string
}

export class Language {
  code: string
  name: string

  constructor(data: LanguageData) {
    this.code = data.code
    this.name = data.name
  }
}
