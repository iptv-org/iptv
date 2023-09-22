import { Storage, Collection, File } from '@freearhey/core'
import { HTMLTable, LogParser, LogItem } from '../core'
import { Category } from '../models'
import { DATA_DIR, LOGS_DIR, README_DIR } from '../constants'
import { Table } from './table'

export class CategoryTable implements Table {
  constructor() {}

  async make() {
    const dataStorage = new Storage(DATA_DIR)
    const categoriesContent = await dataStorage.json('categories.json')
    const categories = new Collection(categoriesContent).map(data => new Category(data))

    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')

    let data = new Collection()
    parser
      .parse(generatorsLog)
      .filter((logItem: LogItem) => logItem.filepath.includes('categories/'))
      .forEach((logItem: LogItem) => {
        const file = new File(logItem.filepath)
        const categoryId = file.name()
        const category: Category = categories.first(
          (category: Category) => category.id === categoryId
        )
        data.add([
          category ? category.name : 'ZZ',
          category ? category.name : 'Undefined',
          logItem.count,
          `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
        ])
      })

    data = data
      .orderBy(item => item[0])
      .map(item => {
        item.shift()
        return item
      })

    const table = new HTMLTable(data.all(), [
      { name: 'Category' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', nowrap: true }
    ])

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_categories.md', table.toString())
  }
}
