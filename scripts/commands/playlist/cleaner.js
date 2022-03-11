const { file, parser, logger, checker, m3u } = require('../../core')
const { program } = require('commander')

const options = program
  .argument('[filepath]', 'Path to file to validate')
  .option('-t, --timeout <timeout>', 'Set timeout for each request', parser.parseNumber, 60000)
  .option('-d, --delay <delay>', 'Set delay for each request', parser.parseNumber, 0)
  .option('--debug', 'Enable debug mode')
  .parse(process.argv)

async function main() {
  const files = program.args.length ? program.args : await file.list('streams/*.m3u')

  for (const filepath of files) {
    if (!filepath.endsWith('.m3u')) continue
    const playlist = await parser.parsePlaylist(filepath)
    for (const stream of playlist.items) {
      const [_, status] = stream.raw.match(/status="([a-z]+)"/) || [null, null]
      stream.status = status
      if (status === 'error') {
        const result = await checkStream(stream)
        const newStatus = parseStatus(result.error)
        if (status === newStatus) {
          stream.remove = true
        }
      }
    }

    const items = playlist.items
      .filter(i => !i.remove)
      .map(item => ({
        attrs: {
          'tvg-id': item.tvg.id,
          status: item.status,
          'user-agent': item.http['user-agent'] || undefined
        },
        title: item.name,
        url: item.url,
        vlcOpts: {
          'http-referrer': item.http.referrer || undefined,
          'http-user-agent': item.http['user-agent'] || undefined
        }
      }))

    const output = m3u.create(items)
    await file.create(filepath, output)
  }
}

main()

async function checkStream(item) {
  const config = {
    timeout: options.timeout,
    delay: options.delay,
    debug: options.debug
  }

  const request = {
    url: item.url,
    http: {
      referrer: item.http.referrer,
      'user-agent': item.http['user-agent']
    }
  }

  return checker.check(request, config)
}

function parseStatus(error) {
  if (!error) return 'online'

  switch (error) {
    case 'Operation timed out':
      return 'timeout'
    case 'Server returned 403 Forbidden (access denied)':
      return 'blocked'
    default:
      return 'error'
  }
}
