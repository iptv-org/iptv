import { Logger } from '@freearhey/core'
import {
  CategoryTable,
  CountryTable,
  LanguageTable,
  RegionTable,
  SubdivisionTable
} from '../../tables'
import { Markdown } from '../../core'
import { README_DIR } from '../../constants'
import path from 'path'

async function main() {
  const logger = new Logger()

  logger.info('creating category table...')
  await new CategoryTable().make()
  logger.info('creating language table...')
  await new LanguageTable().make()
  logger.info('creating country table...')
  await new CountryTable().make()
  logger.info('creating subdivision table...')
  await new SubdivisionTable().make()
  logger.info('creating region table...')
  await new RegionTable().make()

  logger.info('updating readme.md...')
  const configPath = path.join(README_DIR, 'config.json')
  const readme = new Markdown(configPath)
  readme.compile()
}

main()
