import type { CategoryData, CategorySerializedData } from '../types/category'

export class Category {
  id: string
  name: string

  constructor(data: CategoryData) {
    this.id = data.id
    this.name = data.name
  }

  serialize(): CategorySerializedData {
    return {
      id: this.id,
      name: this.name
    }
  }
}
