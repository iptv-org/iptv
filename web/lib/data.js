// Camada de dados: busca os JSON públicos da API do iptv-org, normaliza e
// mantém tudo em cache na memória. Nada é "hardcoded" — se a API mudar, um
// novo carregamento (reload) reflete o conteúdo atualizado.

const API_BASE = process.env.IPTV_API_BASE || 'https://iptv-org.github.io/api'
const FETCH_TIMEOUT_MS = 15000

// Arquivos da API pública que consumimos.
const FILES = [
  'streams',
  'channels',
  'categories',
  'countries',
  'languages',
  'logos',
  'feeds',
  'guides'
]

// Estado em memória, preenchido por load().
const state = {
  streams: [], // streams já normalizados (join com canal/logo/país/idioma)
  categories: [], // [{ id, name, count }]
  countries: [], // [{ code, name, flag, count }]
  languages: [], // [{ code, name, count }]
  hosts: new Set(), // allowlist de hostnames vistos no dataset (usado pelo proxy)
  guidesByStreamId: new Map(), // "channel@feed" -> { siteId, sources } para EPG
  loadedAt: null
}

/**
 * Faz o download de um arquivo JSON da API pública (lado servidor, sem CORS).
 * Usa um timeout para não travar a inicialização nem o /api/reload em caso de
 * rede pendurada.
 */
async function fetchJson(name) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${API_BASE}/${name}.json`, { signal: controller.signal })
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error(`Timeout ao baixar ${name}.json`)
    throw err
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) throw new Error(`Falha ao baixar ${name}.json (HTTP ${res.status})`)
  return res.json()
}

/**
 * Remove a sintaxe inline de headers que alguns streams trazem na URL:
 *   http://host/file.m3u8|Referer="x"|User-Agent="y"|Origin="z"
 * Retorna a URL limpa e os headers extraídos.
 */
function splitInlineHeaders(rawUrl) {
  const [url, ...parts] = String(rawUrl).split('|')
  const headers = {}
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const key = part.slice(0, eq).trim().toLowerCase()
    const value = part.slice(eq + 1).trim().replace(/^"|"$/g, '')
    if (key === 'referer' || key === 'referrer') headers.referrer = value
    else if (key === 'user-agent') headers.userAgent = value
  }
  return { url, headers }
}

/** Extrai o hostname de uma URL, ou null se inválida. */
function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/**
 * Escolhe o melhor logo para um stream entre os candidatos do canal.
 * Prioriza logos em uso e com resolução próxima de 512px.
 */
function pickLogo(candidates, feedId) {
  if (!candidates || candidates.length === 0) return ''
  const scored = candidates
    .map(logo => {
      let score = 0
      if (logo.in_use) score += 1000
      if (logo.feed && feedId && logo.feed === feedId) score += 100
      if (!logo.feed) score += 50 // logo genérico do canal serve para qualquer feed
      // quanto mais perto de 512px, melhor
      const w = logo.width || 0
      const h = logo.height || 0
      score -= (Math.abs(512 - w) + Math.abs(512 - h)) / 100
      return { url: logo.url, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored[0].url
}

/** (Re)carrega e normaliza todos os dados da API pública. */
async function load() {
  const [streams, channels, categories, countries, languages, logos, feeds, guides] =
    await Promise.all(FILES.map(fetchJson))

  // Guias (EPG) por "channel@feed": guarda as fontes XMLTV e os ids que podem
  // aparecer no atributo `channel` do XMLTV. Guias gerados pelo iptv-org usam o
  // id do stream ("Canal.cc@Feed") ou o id do canal ("Canal.cc"); o site_id é
  // só um fallback. Casamos contra todos.
  const guidesByStreamId = new Map()
  for (const guide of guides) {
    if (!guide.channel) continue
    const sources = (guide.sources || [])
      .filter(src => src.url && (src.format === 'XML' || src.format === 'GZIP'))
      .map(src => ({ url: src.url, format: src.format }))
    if (sources.length === 0) continue
    const key = `${guide.channel}@${guide.feed}`
    const ids = [key, guide.channel]
    if (guide.site_id && guide.site_id !== '#') ids.push(guide.site_id)
    // Mantém só o primeiro guia por stream (evita duplicatas).
    if (!guidesByStreamId.has(key)) {
      guidesByStreamId.set(key, { ids, sources })
    }
  }

  // Índices de apoio (lookup O(1)).
  const channelById = new Map(channels.map(c => [c.id, c]))
  const categoryById = new Map(categories.map(c => [c.id, c]))
  const countryByCode = new Map(countries.map(c => [c.code, c]))
  const languageByCode = new Map(languages.map(l => [l.code, l]))

  // Logos agrupados por canal.
  const logosByChannel = new Map()
  for (const logo of logos) {
    if (!logo.channel) continue
    if (!logosByChannel.has(logo.channel)) logosByChannel.set(logo.channel, [])
    logosByChannel.get(logo.channel).push(logo)
  }

  // Idiomas por "channel@feed" (vindos de feeds.json).
  const langCodesByFeed = new Map()
  for (const feed of feeds) {
    if (!feed.channel) continue
    const key = `${feed.channel}@${feed.id}`
    langCodesByFeed.set(key, feed.languages || [])
  }

  const hosts = new Set()
  const categoryCount = new Map()
  const countryCount = new Map()
  const languageCount = new Map()

  const normalized = streams.map((s, index) => {
    const { url, headers } = splitInlineHeaders(s.url)

    const host = hostOf(url)
    if (host) hosts.add(host)

    const channel = s.channel ? channelById.get(s.channel) : null

    // Categorias (ids -> {id,name}).
    const categoryIds = channel ? channel.categories || [] : []
    const cats = categoryIds
      .map(id => categoryById.get(id))
      .filter(Boolean)
      .map(c => ({ id: c.id, name: c.name }))

    // País.
    const countryCode = channel ? channel.country : null
    const countryRec = countryCode ? countryByCode.get(countryCode) : null
    const country = countryRec
      ? { code: countryRec.code, name: countryRec.name, flag: countryRec.flag }
      : null

    // Idiomas (via feeds).
    const feedKey = s.channel ? `${s.channel}@${s.feed}` : null
    const langCodes = feedKey ? langCodesByFeed.get(feedKey) || [] : []
    const langs = langCodes
      .map(code => languageByCode.get(code))
      .filter(Boolean)
      .map(l => ({ code: l.code, name: l.name }))

    // Contadores para os filtros da UI.
    for (const c of cats) categoryCount.set(c.id, (categoryCount.get(c.id) || 0) + 1)
    if (country) countryCount.set(country.code, (countryCount.get(country.code) || 0) + 1)
    for (const l of langs) languageCount.set(l.code, (languageCount.get(l.code) || 0) + 1)

    const logo = channel ? pickLogo(logosByChannel.get(s.channel), s.feed) : ''

    return {
      id: `${s.channel || 'unknown'}@${s.feed || ''}#${index}`,
      channel: s.channel || null,
      channelName: channel ? channel.name : '',
      feed: s.feed || null,
      name: s.title || (channel ? channel.name : 'Sem nome'),
      url,
      quality: s.quality || null,
      label: s.label || null,
      referrer: s.referrer || headers.referrer || null,
      userAgent: s.user_agent || headers.userAgent || null,
      logo: logo || '',
      categories: cats,
      country,
      languages: langs,
      isNsfw: channel ? !!channel.is_nsfw : false,
      isHls: /\.m3u8(\?|$)/i.test(url) || /m3u8/i.test(url)
    }
  })

  // Materializa as listas de filtros com contagem, ordenadas.
  state.categories = categories
    .map(c => ({ id: c.id, name: c.name, count: categoryCount.get(c.id) || 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  state.countries = countries
    .map(c => ({ code: c.code, name: c.name, flag: c.flag, count: countryCount.get(c.code) || 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  state.languages = languages
    .map(l => ({ code: l.code, name: l.name, count: languageCount.get(l.code) || 0 }))
    .filter(l => l.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  state.streams = normalized
  state.hosts = hosts
  state.guidesByStreamId = guidesByStreamId
  state.loadedAt = new Date().toISOString()

  return { total: normalized.length }
}

/**
 * Consulta filtrada e paginada sobre os streams normalizados.
 */
function query({ search, category, country, language, includeNsfw, page = 1, limit = 60 } = {}) {
  const term = (search || '').trim().toLowerCase()
  let list = state.streams

  if (!includeNsfw) list = list.filter(s => !s.isNsfw)
  if (category) list = list.filter(s => s.categories.some(c => c.id === category))
  if (country) list = list.filter(s => s.country && s.country.code === country)
  if (language) list = list.filter(s => s.languages.some(l => l.code === language))
  if (term) {
    list = list.filter(
      s =>
        s.name.toLowerCase().includes(term) ||
        (s.channelName && s.channelName.toLowerCase().includes(term))
    )
  }

  const total = list.length
  const lim = Math.min(Math.max(parseInt(limit, 10) || 60, 1), 200)
  const pg = Math.max(parseInt(page, 10) || 1, 1)
  const start = (pg - 1) * lim
  const items = list.slice(start, start + lim)

  return { items, total, page: pg, limit: lim, pages: Math.ceil(total / lim) }
}

function meta() {
  return {
    total: state.streams.length,
    categories: state.categories,
    countries: state.countries,
    languages: state.languages,
    loadedAt: state.loadedAt
  }
}

/** A allowlist de hosts usada pelo proxy para evitar virar um proxy aberto. */
function getHosts() {
  return state.hosts
}

/**
 * Retorna o guia (EPG) de um stream ("channel@feed"), ou null se não houver.
 * @returns {{ ids: string[], sources: {url:string,format:string}[] } | null}
 */
function getGuideForStream(streamId) {
  return state.guidesByStreamId.get(streamId) || null
}

export default { load, query, meta, getHosts, getGuideForStream, hostOf, splitInlineHeaders }
