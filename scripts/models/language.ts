type LanguageProps = {
  code: string
  name: string
}

export class Language {
  code: string
  name: string

  constructor({ code, name }: LanguageProps) {
    this.code = code
    this.name = name
  }
}
