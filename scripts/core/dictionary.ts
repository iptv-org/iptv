export class Dictionary {
  dict: any

  constructor(dict?: any) {
    this.dict = dict || {}
  }

  set(key: string, value: any) {
    this.dict[key] = value
  }

  has(key: string): boolean {
    return !!this.dict[key]
  }

  missing(key: string): boolean {
    return !this.dict[key]
  }

  get(key: string): any {
    return this.dict[key] ? this.dict[key] : undefined
  }

  keys(): string[] {
    return Object.keys(this.dict)
  }

  data() {
    return this.dict
  }
}
