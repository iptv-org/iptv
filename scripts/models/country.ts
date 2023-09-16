type CountryProps = {
  code: string
  name: string
  languages: string[]
  flag: string
}

export class Country {
  code: string
  name: string
  languages: string[]
  flag: string

  constructor({ code, name, languages, flag }: CountryProps) {
    this.code = code
    this.name = name
    this.languages = languages
    this.flag = flag
  }
}
