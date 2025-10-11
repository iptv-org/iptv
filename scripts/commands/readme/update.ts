import { CategoriesTable, CountriesTable, LanguagesTable, RegionsTable } from '../../tables'
import { README_DIR, ROOT_DIR } from '../../constants'
import { Logger } from '@freearhey/core'
import { Markdown } from '../../core'
import { loadData } from '../../api'

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  await loadData()

  logger.info('creating category table...')
  await new CategoriesTable().create()
  logger.info('creating language table...')
  await new LanguagesTable().create()
  logger.info('creating countires table...')
  await new CountriesTable().create()
  logger.info('creating region table...')
  await new RegionsTable().create()

  logger.info('updating playlists.md...')
  const playlists = new Markdown({
    build: `${ROOT_DIR}/PLAYLISTS.md`,
    template: `${README_DIR}/template.md`
  })
  playlists.compile()
}

main()
