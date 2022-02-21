const { program } = require('commander')
const { db, logger, timer, checker, store, file, parser } = require('../core')

const options = program
  .requiredOption('-c, --cluster-id <cluster-id>', 'The ID of cluster to load', parser.parseNumber)
  .option('-t, --timeout <timeout>', 'Set timeout for each request', parser.parseNumber, 60000)
  .option('-d, --delay <delay>', 'Set delay for each request', parser.parseNumber, 0)
  .option('--debug', 'Enable debug mode')
  .parse(process.argv)
  .opts()

const config = {
  timeout: options.timeout,
  delay: options.delay,
  debug: options.debug
}

const LOGS_PATH = process.env.LOGS_PATH || 'scripts/logs'

async function main() {
  logger.info('Starting...')
  logger.info(`Timeout: ${options.timeout}ms`)
  logger.info(`Delay: ${options.delay}ms`)
  timer.start()

  const clusterLog = `${LOGS_PATH}/check-streams/cluster_${options.clusterId}.log`
  logger.info(`Loading cluster: ${options.clusterId}`)
  logger.info(`Creating '${clusterLog}'...`)
  await file.create(clusterLog)
  const items = await db.find({ cluster_id: options.clusterId })
  const total = items.length
  logger.info(`Found ${total} links`)

  logger.info('Checking...')
  const results = {}
  for (const [i, item] of items.entries()) {
    const message = `[${i + 1}/${total}] ${item.filepath}: ${item.url}`
    const result = await checker.check(item, config)
    if (!result.error) {
      logger.info(message)
    } else {
      logger.info(`${message} (${result.error})`)
    }
    await file.append(clusterLog, JSON.stringify(result) + '\n')
  }

  logger.info(`Done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}

main()
