import { DATA_DIR } from '../../constants'
import { Storage } from '@freearhey/core'
import { DataLoader } from '../../core'

async function main() {
  const storage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage })

  await Promise.all([
    loader.download('blocklist.json'),
    loader.download('categories.json'),
    loader.download('channels.json'),
    loader.download('countries.json'),
    loader.download('languages.json'),
    loader.download('regions.json'),
    loader.download('subdivisions.json'),
    loader.download('feeds.json'),
    loader.download('timezones.json'),
    loader.download('guides.json'),
    loader.download('streams.json')
  ])
}

main()
