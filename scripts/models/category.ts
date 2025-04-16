type CategoryData = {
  id: string
  name: string
}

export class Category {
  id: string
  name: string

  constructor(data: CategoryData) {
    this.id = data.id
    this.name = data.name
  }
}
