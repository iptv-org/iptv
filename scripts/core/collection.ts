import _ from 'lodash'
import { orderBy, Order } from 'natural-orderby'
import { Dictionary } from './'

type Iteratee = (value: any, value2?: any) => void

export class Collection {
  _items: any[]

  constructor(items?: any[]) {
    this._items = Array.isArray(items) ? items : []
  }

  first(predicate?: Iteratee) {
    if (predicate) {
      return this._items.find(predicate)
    }

    return this._items[0]
  }

  last(predicate?: Iteratee) {
    if (predicate) {
      return _.findLast(this._items, predicate)
    }

    return this._items[this._items.length - 1]
  }

  find(iteratee: Iteratee): Collection {
    const found = this._items.filter(iteratee)

    return new Collection(found)
  }

  add(data: any) {
    this._items.push(data)

    return this
  }

  intersects(collection: Collection): boolean {
    return _.intersection(this._items, collection.all()).length > 0
  }

  count() {
    return this._items.length
  }

  join(separator: string) {
    return this._items.join(separator)
  }

  indexOf(value: string) {
    return this._items.indexOf(value)
  }

  push(data: any) {
    this.add(data)
  }

  uniq() {
    const items = _.uniq(this._items)

    return new Collection(items)
  }

  reduce(iteratee: Iteratee, accumulator: any) {
    const items = _.reduce(this._items, iteratee, accumulator)

    return new Collection(items)
  }

  filter(iteratee: Iteratee) {
    const items = _.filter(this._items, iteratee)

    return new Collection(items)
  }

  forEach(iteratee: Iteratee) {
    for (let item of this._items) {
      iteratee(item)
    }

    return this
  }

  remove(iteratee: Iteratee): Collection {
    const removed = _.remove(this._items, iteratee)

    return new Collection(removed)
  }

  concat(collection: Collection) {
    const items = this._items.concat(collection._items)

    return new Collection(items)
  }

  isEmpty(): boolean {
    return this._items.length === 0
  }

  notEmpty(): boolean {
    return this._items.length > 0
  }

  sort() {
    const items = this._items.sort()

    return new Collection(items)
  }

  orderBy(iteratees: Iteratee | Iteratee[], orders?: Order | Order[]) {
    const items = orderBy(this._items, iteratees, orders)

    return new Collection(items)
  }

  keyBy(iteratee: Iteratee) {
    const items = _.keyBy(this._items, iteratee)

    return new Dictionary(items)
  }

  empty() {
    return this._items.length === 0
  }

  includes(value: any) {
    if (typeof value === 'function') {
      const found = this._items.find(value)

      return !!found
    }

    return this._items.includes(value)
  }

  missing(value: any) {
    if (typeof value === 'function') {
      const found = this._items.find(value)

      return !found
    }

    return !this._items.includes(value)
  }

  uniqBy(iteratee: Iteratee) {
    const items = _.uniqBy(this._items, iteratee)

    return new Collection(items)
  }

  groupBy(iteratee: Iteratee) {
    const object = _.groupBy(this._items, iteratee)

    return new Dictionary(object)
  }

  map(iteratee: Iteratee) {
    const items = this._items.map(iteratee)

    return new Collection(items)
  }

  all() {
    return this._items
  }

  toJSON() {
    return JSON.stringify(this._items)
  }
}
