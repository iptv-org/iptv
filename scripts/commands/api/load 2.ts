import { Logger } from '@freearhey/core'
import { ApiClient } from '../../core'

async function main() {
  const logger = new Logger()
  const client = new ApiClient({ logger })

  const requests = [
    client.download('blocklist.json'),
    client.download('categories.json'),
    client.download('channels.json'),
    client.download('countries.json'),
    client.download('languages.json'),
    client.download('regions.json'),
    client.download('subdivisions.json')
  ]

  await Promise.all(requests)
}

main()
