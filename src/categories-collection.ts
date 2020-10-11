import { Category } from "./types"

export class CategoriesCollection {
  list: Category[] = []

  random(): Category | undefined {
    return this.list[Math.floor(Math.random() * this.list.length)]
  }

  has(category: Category) {
    return this.list.some(c => c.id === category.id)
  }

  add(category: Category) {
    this.list.push(category)
  }

  remove(category: Category) {
    this.list.splice(this.list.findIndex(c => c.id === category.id), 1)
  }
}