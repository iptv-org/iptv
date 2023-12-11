type CategoryProps = {
  id: string
  name: string
}

export class Category {
  id: string
  name: string

  constructor({ id, name }: CategoryProps) {
    this.id = id
    this.name = name
  }
}
