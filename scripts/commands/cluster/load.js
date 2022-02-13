const { db, logger, timer, checker, store, file, parser } = require('../../core')
const { program } = require('commander')

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

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs/cluster/load'

async function main() {
  logger.info('starting...')
  logger.info(`timeout: ${options.timeout}ms`)
  logger.info(`delay: ${options.delay}ms`)
  timer.start()

  const clusterLog = `${LOGS_DIR}/cluster_${options.clusterId}.log`
  logger.info(`loading cluster: ${options.clusterId}`)
  logger.info(`creating '${clusterLog}'...`)
  await file.create(clusterLog)
  await db.streams.load()
  const items = await db.streams.find({ cluster_id: options.clusterId })
  const total = items.length
  logger.info(`found ${total} links`)

  logger.info('checking...')
  const results = {}
  for (const [i, item] of items.entries()) {
    const message = `[${i + 1}/${total}] ${item.filepath}: ${item.url}`
    const request = {
      _id: item._id,
      url: item.url,
      http: {
        referrer: item.http_referrer,
        'user-agent': item.user_agent
      }
    }
    const result = await checker.check(request, config)
    if (!result.error) {
      logger.info(message)
    } else {
      logger.info(`${message} (${result.error})`)
    }
    const output = {
      _id: result._id,
      error: result.error,
      streams: result.streams,
      requests: result.requests
    }
    await file.append(clusterLog, JSON.stringify(output) + '\n')
  }

  logger.info(`done in ${timer.format('HH[h] mm[m] ss[s]')}`)
}

main()
