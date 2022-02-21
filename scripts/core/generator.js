const { create: createPlaylist } = require('./playlist')
const store = require('./store')
const file = require('./file')
const logger = require('./logger')
const db = require('./db')
const _ = require('lodash')

const generator = {}

generator.generate = async function (filepath, query = {}, options = {}) {
  options = {
    ...{
      format: 'm3u',
      saveEmpty: false,
      includeNSFW: false,
      includeGuides: true,
      includeBroken: false,
      onLoad: r => r,
      uniqBy: item => item.id || _.uniqueId(),
      sortBy: null
    },
    ...options
  }

  query['is_nsfw'] = options.includeNSFW ? { $in: [true, false] } : false
  query['is_broken'] = options.includeBroken ? { $in: [true, false] } : false

  let items = await db
    .find(query)
    .sort({ name: 1, 'status.level': 1, 'resolution.height': -1, url: 1 })

  items = _.uniqBy(items, 'url')
  if (!options.saveEmpty && !items.length) return { filepath, query, options, count: 0 }
  if (options.uniqBy) items = _.uniqBy(items, options.uniqBy)

  items = options.onLoad(items)

  if (options.sortBy) items = _.sortBy(items, options.sortBy)

  switch (options.format) {
    case 'json':
      await saveAsJSON(filepath, items, options)
      break
    case 'm3u':
    default:
      await saveAsM3U(filepath, items, options)
      break
  }

  return { filepath, query, options, count: items.length }
}

async function saveAsM3U(filepath, items, options) {
  const playlist = await createPlaylist(filepath)

  const header = {}
  if (options.includeGuides) {
    let guides = items.map(item => item.guides)
    guides = _.uniq(_.flatten(guides)).sort().join(',')

    header['x-tvg-url'] = guides
  }

  await playlist.header(header)
  for (const item of items) {
    const stream = store.create(item)
    await playlist.link(
      stream.get('url'),
      stream.get('title'),
      {
        'tvg-id': stream.get('tvg_id'),
        'tvg-country': stream.get('tvg_country'),
        'tvg-language': stream.get('tvg_language'),
        'tvg-logo': stream.get('tvg_logo'),
        // 'tvg-url': stream.get('tvg_url') || undefined,
        'user-agent': stream.get('http.user-agent') || undefined,
        'group-title': stream.get('group_title')
      },
      {
        'http-referrer': stream.get('http.referrer') || undefined,
        'http-user-agent': stream.get('http.user-agent') || undefined
      }
    )
  }
}

async function saveAsJSON(filepath, items, options) {
  const output = items.map(item => {
    const stream = store.create(item)
    const categories = stream.get('categories').map(c => ({ name: c.name, slug: c.slug }))
    const countries = stream.get('countries').map(c => ({ name: c.name, code: c.code }))

    return {
      name: stream.get('name'),
      logo: stream.get('logo'),
      url: stream.get('url'),
      categories,
      countries,
      languages: stream.get('languages'),
      tvg: {
        id: stream.get('tvg_id'),
        name: stream.get('name'),
        url: stream.get('tvg_url')
      }
    }
  })

  await file.create(filepath, JSON.stringify(output))
}

generator.saveAsM3U = saveAsM3U
generator.saveAsJSON = saveAsJSON

module.exports = generator
