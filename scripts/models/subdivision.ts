type SubdivisionProps = {
  code: string
  name: string
  country: string
}

export class Subdivision {
  code: string
  name: string
  country: string

  constructor({ code, name, country }: SubdivisionProps) {
    this.code = code
    this.name = name
    this.country = country
  }
}
