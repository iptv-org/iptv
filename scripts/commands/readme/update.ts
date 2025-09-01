import { CategoriesTable, CountriesTable, LanguagesTable, RegionsTable } from '../../tables'
import { DataLoader, DataProcessor, Markdown } from '../../core'
import { DataProcessorData } from '../../types/dataProcessor'
import { DataLoaderData } from '../../types/dataLoader'
import { README_DIR, DATA_DIR, ROOT_DIR } from '../../constants'
import { Logger, Storage } from '@freearhey/core'

async function main() {
  const logger = new Logger()
  const dataStorage = new Storage(DATA_DIR)
  const processor = new DataProcessor()
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const {
    subdivisionsKeyByCode,
    languagesKeyByCode,
    countriesKeyByCode,
    categoriesKeyById,
    subdivisions,
    countries,
    regions,
    cities
  }: DataProcessorData = processor.process(data)

  logger.info('creating category table...')
  await new CategoriesTable({ categoriesKeyById }).make()
  logger.info('creating language table...')
  await new LanguagesTable({ languagesKeyByCode }).make()
  logger.info('creating countires table...')
  await new CountriesTable({
    countriesKeyByCode,
    subdivisionsKeyByCode,
    subdivisions,
    countries,
    cities
  }).make()
  logger.info('creating region table...')
  await new RegionsTable({ regions }).make()

  logger.info('updating playlists.md...')
  const playlists = new Markdown({
    build: `${ROOT_DIR}/PLAYLISTS.md`,
    template: `${README_DIR}/template.md`
  })
  playlists.compile()
}

main()
