const { db, logger, generator, file } = require('../core')
const _ = require('lodash')

let languages = []
let countries = []
let categories = []
let regions = []

const LOGS_PATH = process.env.LOGS_PATH || 'scripts/logs'
const PUBLIC_PATH = process.env.PUBLIC_PATH || '.gh-pages'

async function main() {
  await setUp()

  await generateCategories()
  await generateCountries()
  await generateLanguages()
  await generateRegions()
  await generateIndex()
  await generateIndexNSFW()
  await generateIndexCategory()
  await generateIndexCountry()
  await generateIndexLanguage()
  await generateIndexRegion()

  await generateChannelsJson()
}

main()

async function generateCategories() {
  logger.info(`Generating categories/...`)

  for (const category of categories) {
    const { count } = await generator.generate(
      `${PUBLIC_PATH}/categories/${category.slug}.m3u`,
      { categories: { $elemMatch: category } },
      { saveEmpty: true, includeNSFW: true }
    )

    await log('categories', {
      name: category.name,
      slug: category.slug,
      count
    })
  }

  const { count: otherCount } = await generator.generate(
    `${PUBLIC_PATH}/categories/other.m3u`,
    { categories: { $size: 0 } },
    { saveEmpty: true }
  )

  await log('categories', {
    name: 'Other',
    slug: 'other',
    count: otherCount
  })
}

async function generateCountries() {
  logger.info(`Generating countries/...`)

  for (const country of countries) {
    const { count } = await generator.generate(
      `${PUBLIC_PATH}/countries/${country.code.toLowerCase()}.m3u`,
      {
        countries: { $elemMatch: country }
      }
    )

    await log('countries', {
      name: country.name,
      code: country.code,
      count
    })
  }

  const { count: undefinedCount } = await generator.generate(
    `${PUBLIC_PATH}/countries/undefined.m3u`,
    {
      countries: { $size: 0 }
    }
  )

  await log('countries', {
    name: 'Undefined',
    code: 'UNDEFINED',
    count: undefinedCount
  })
}

async function generateLanguages() {
  logger.info(`Generating languages/...`)

  for (const language of _.uniqBy(languages, 'code')) {
    const { count } = await generator.generate(`${PUBLIC_PATH}/languages/${language.code}.m3u`, {
      languages: { $elemMatch: language }
    })

    await log('languages', {
      name: language.name,
      code: language.code,
      count
    })
  }

  const { count: undefinedCount } = await generator.generate(
    `${PUBLIC_PATH}/languages/undefined.m3u`,
    {
      languages: { $size: 0 }
    }
  )

  await log('languages', {
    name: 'Undefined',
    code: 'undefined',
    count: undefinedCount
  })
}

async function generateRegions() {
  logger.info(`Generating regions/...`)

  for (const region of regions) {
    const { count } = await generator.generate(
      `${PUBLIC_PATH}/regions/${region.code.toLowerCase()}.m3u`,
      {
        regions: { $elemMatch: region }
      }
    )

    await log('regions', {
      name: region.name,
      code: region.code,
      count
    })
  }

  const { count: undefinedCount } = await generator.generate(
    `${PUBLIC_PATH}/regions/undefined.m3u`,
    { regions: { $size: 0 } },
    { saveEmpty: true }
  )

  await log('regions', {
    name: 'Undefined',
    code: 'UNDEFINED',
    count: undefinedCount
  })
}

async function generateIndexNSFW() {
  logger.info(`Generating index.nsfw.m3u...`)

  await generator.generate(`${PUBLIC_PATH}/index.nsfw.m3u`, {}, { includeNSFW: true })
}

async function generateIndex() {
  logger.info(`Generating index.m3u...`)

  await generator.generate(`${PUBLIC_PATH}/index.m3u`, {})
}

async function generateIndexCategory() {
  logger.info(`Generating index.category.m3u...`)

  await generator.generate(
    `${PUBLIC_PATH}/index.category.m3u`,
    {},
    { 
      onLoad: function (items) {
        let results = items
          .filter(item => !item.categories || !item.categories.length)
          .map(item => {
            const newItem = _.cloneDeep(item)
            newItem.group_title = ''
            return newItem
          })
        for (const category of _.sortBy(Object.values(categories), ['name'])) {
          let filtered = items
            .filter(item => {
              return Array.isArray(item.categories) && item.categories.map(c => c.slug).includes(category.slug)
            })
            .map(item => {
              const newItem = _.cloneDeep(item)
              newItem.group_title = category.name
              return newItem
            })
          results = results.concat(filtered)
        }

        return results
      },
      sortBy: item => item.group_title }
  )
}

async function generateIndexCountry() {
  logger.info(`Generating index.country.m3u...`)

  await generator.generate(
    `${PUBLIC_PATH}/index.country.m3u`,
    {},
    {
      onLoad: function (items) {
        let results = items
          .filter(item => !item.countries || !item.countries.length)
          .map(item => {
            const newItem = _.cloneDeep(item)
            newItem.group_title = ''
            newItem.categories = []
            return newItem
          })
        for (const country of _.sortBy(Object.values(countries), ['name'])) {
          let filtered = items
            .filter(item => {
              return Array.isArray(item.countries) && item.countries.map(c => c.code).includes(country.code)
            })
            .map(item => {
              const newItem = _.cloneDeep(item)
              newItem.group_title = country.name
              return newItem
            })
          results = results.concat(filtered)
        }

        return results
      },
      sortBy: item => item.group_title
    }
  )
}

async function generateIndexLanguage() {
  logger.info(`Generating index.language.m3u...`)

  await generator.generate(
    `${PUBLIC_PATH}/index.language.m3u`,
    {},
    {
      onLoad: function (items) {
        let results = items
          .filter(item => !item.languages || !item.languages.length)
          .map(item => {
            const newItem = _.cloneDeep(item)
            newItem.group_title = ''
            newItem.categories = []
            return newItem
          })
        for (const language of languages) {
          let filtered = items
            .filter(item => {
              return Array.isArray(item.languages) && item.languages.map(c => c.code).includes(language.code)
            })
            .map(item => {
              const newItem = _.cloneDeep(item)
              newItem.group_title = language.name
              return newItem
            })
          results = results.concat(filtered)
        }

        return results
      },
      sortBy: item => item.group_title
    }
  )
}

async function generateIndexRegion() {
  logger.info(`Generating index.region.m3u...`)

  await generator.generate(
    `${PUBLIC_PATH}/index.region.m3u`,
    {},
    {
      onLoad: function (items) {
        let results = items
          .filter(item => !item.regions.length)
          .map(item => {
            const newItem = _.cloneDeep(item)
            newItem.group_title = ''
            newItem.categories = []
            return newItem
          })
        for (const region of regions) {
          let filtered = items
            .filter(item => {
              return item.regions.map(c => c.code).includes(region.code)
            })
            .map(item => {
              const newItem = _.cloneDeep(item)
              newItem.group_title = region.name
              return newItem
            })
          results = results.concat(filtered)
        }

        return results
      },
      sortBy: item => item.group_title
    }
  )
}

async function generateChannelsJson() {
  logger.info('Generating channels.json...')

  await generator.generate(`${PUBLIC_PATH}/channels.json`, {}, { format: 'json', includeNSFW: true })
}

async function setUp() {
  logger.info(`Loading database...`)
  const items = await db.find({})
  categories = _.sortBy(_.uniqBy(_.flatten(items.map(i => i.categories)), 'slug'), ['name']).filter(i => i)
  countries = _.sortBy(_.uniqBy(_.flatten(items.map(i => i.countries)), 'code'), ['name']).filter(i => i)
  languages = _.sortBy(_.uniqBy(_.flatten(items.map(i => i.languages)), 'code'), ['name']).filter(i => i)
  regions = _.sortBy(_.uniqBy(_.flatten(items.map(i => i.regions)), 'code'), ['name']).filter(i => i)

  const categoriesLog = `${LOGS_PATH}/generate-playlists/categories.log`
  const countriesLog = `${LOGS_PATH}/generate-playlists/countries.log`
  const languagesLog = `${LOGS_PATH}/generate-playlists/languages.log`
  const regionsLog = `${LOGS_PATH}/generate-playlists/regions.log`

  logger.info(`Creating '${categoriesLog}'...`)
  await file.create(categoriesLog)
  logger.info(`Creating '${countriesLog}'...`)
  await file.create(countriesLog)
  logger.info(`Creating '${languagesLog}'...`)
  await file.create(languagesLog)
  logger.info(`Creating '${regionsLog}'...`)
  await file.create(regionsLog)
}

async function log(type, data) {
  await file.append(`${LOGS_PATH}/generate-playlists/${type}.log`, JSON.stringify(data) + '\n')
}
