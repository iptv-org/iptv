import { Storage, Collection, File, Dictionary } from '@freearhey/core'
import { HTMLTable, LogParser, LogItem } from '../core'
import { LOGS_DIR, README_DIR } from '../constants'
import { Category } from '../models'
import { Table } from './table'

type CategoriesTableProps = {
  categoriesKeyById: Dictionary
}

export class CategoriesTable implements Table {
  categoriesKeyById: Dictionary

  constructor({ categoriesKeyById }: CategoriesTableProps) {
    this.categoriesKeyById = categoriesKeyById
  }

  async make() {
    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')

    let items = new Collection()
    parser
      .parse(generatorsLog)
      .filter((logItem: LogItem) => logItem.type === 'category')
      .forEach((logItem: LogItem) => {
        const file = new File(logItem.filepath)
        const categoryId = file.name()
        const category: Category = this.categoriesKeyById.get(categoryId)

        items.add([
          category ? category.name : 'ZZ',
          category ? category.name : 'Undefined',
          logItem.count,
          `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
        ])
      })

    items = items
      .orderBy(item => item[0])
      .map(item => {
        item.shift()
        return item
      })

    const table = new HTMLTable(items.all(), [
      { name: 'Category' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', nowrap: true }
    ])

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_categories.md', table.toString())
  }
}
