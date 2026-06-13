// EPG (Electronic Program Guide) — "Agora/A seguir" para um stream.
//
// É um recurso best-effort: a programação real vive em arquivos XMLTV externos
// (fontes mapeadas em guides.json da API do iptv-org). Buscamos sob demanda,
// com timeout, limite de tamanho e cache, e degradamos graciosamente — se a
// fonte estiver indisponível, devolvemos lista vazia e a UI simplesmente não
// mostra o guia. Inspirado nas "EPG Sources" do awesome-iptv.

import zlib from 'node:zlib'
import { promisify } from 'node:util'

const gunzip = promisify(zlib.gunzip)

const FETCH_TIMEOUT_MS = 12000
const MAX_BYTES = 30 * 1024 * 1024 // 30 MB por arquivo XMLTV
const RAW_TTL_MS = 10 * 60 * 1000 // cache do XMLTV bruto: 10 min
const RESULT_TTL_MS = 30 * 60 * 1000 // cache do resultado now/next: 30 min
const MAX_RAW_CACHE = 3 // no máx. 3 arquivos brutos em memória

// Cache LRU pequeno do XMLTV bruto (texto), por URL.
const rawCache = new Map() // url -> { at, text }
// Cache do resultado processado, por "url|siteId".
const resultCache = new Map() // key -> { at, programs }

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

/** Converte data XMLTV ("20260612180000 +0000") em epoch ms, ou null. */
function parseXmltvDate(value) {
  if (!value) return null
  const m = String(value).match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{4})?/)
  if (!m) return null
  const [, y, mo, d, h, mi, s = '00', tz] = m
  let iso = `${y}-${mo}-${d}T${h}:${mi}:${s}`
  if (tz) iso += `${tz.slice(0, 3)}:${tz.slice(3)}`
  else iso += 'Z'
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

/** Decodifica as entidades XML mais comuns. */
function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

/** Baixa o XMLTV (XML ou GZIP) com timeout e limite de tamanho. */
async function fetchXmltv(source) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': DEFAULT_UA, Accept: '*/*' },
      redirect: 'follow',
      signal: controller.signal
    })
    if (!res.ok) return null

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > MAX_BYTES) return null

    const isGzip = source.format === 'GZIP' || (buf[0] === 0x1f && buf[1] === 0x8b)
    const out = isGzip ? await gunzip(buf) : buf
    if (out.byteLength > MAX_BYTES) return null
    return out.toString('utf8')
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/** Pega o XMLTV bruto do cache ou baixa, mantendo o cache pequeno. */
async function getRaw(source) {
  const cached = rawCache.get(source.url)
  if (cached && Date.now() - cached.at < RAW_TTL_MS) return cached.text

  const text = await fetchXmltv(source)
  if (text == null) return null

  rawCache.set(source.url, { at: Date.now(), text })
  // Evita crescer demais: descarta o mais antigo.
  while (rawCache.size > MAX_RAW_CACHE) {
    const oldestKey = rawCache.keys().next().value
    rawCache.delete(oldestKey)
  }
  return text
}

/** Extrai os programas cujo `channel` casa com algum dos ids candidatos. */
function extractPrograms(xmltv, ids) {
  const idSet = new Set(ids)
  // Atalho: se nenhum id aparece no arquivo, não há o que processar.
  if (!ids.some(id => xmltv.includes(`"${id}"`))) return []

  const programs = []
  const re = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi
  let match
  while ((match = re.exec(xmltv)) !== null) {
    const attrs = match[1]
    const channelMatch = attrs.match(/\bchannel="([^"]*)"/i)
    if (!channelMatch || !idSet.has(channelMatch[1])) continue

    const start = parseXmltvDate((attrs.match(/\bstart="([^"]*)"/i) || [])[1])
    const stop = parseXmltvDate((attrs.match(/\bstop="([^"]*)"/i) || [])[1])
    const titleMatch = match[2].match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? decodeEntities(titleMatch[1]) : ''
    if (start && title) programs.push({ title, start, stop })
  }
  programs.sort((a, b) => a.start - b.start)
  return programs
}

/** Seleciona "agora" + os próximos 2 programas. */
function pickNowNext(programs) {
  const now = Date.now()
  const current = programs.find(p => p.start <= now && (!p.stop || p.stop > now))
  const upcoming = programs.filter(p => p.start > now).slice(0, 2)
  const selected = []
  if (current) selected.push({ ...current, isNow: true })
  for (const p of upcoming) selected.push({ ...p, isNow: false })
  return selected
}

/**
 * Retorna até 3 programas (agora + próximos) para um guia.
 * @param {{ ids: string[], sources: {url:string,format:string}[] }} guide
 */
async function getNowNext(guide) {
  if (!guide || !guide.ids?.length || !guide.sources?.length) return []

  for (const source of guide.sources) {
    const key = `${source.url}|${guide.ids[0]}`
    const cached = resultCache.get(key)
    // Só usa o cache quando há programas: assim uma fonte vazia não impede
    // tentar as fontes seguintes até o TTL expirar (o XMLTV bruto ainda é
    // cacheado por getRaw, então não há novo download).
    if (cached && cached.programs.length > 0 && Date.now() - cached.at < RESULT_TTL_MS) {
      return cached.programs
    }

    const raw = await getRaw(source)
    if (!raw) continue

    const programs = pickNowNext(extractPrograms(raw, guide.ids))
    if (programs.length > 0) {
      resultCache.set(key, { at: Date.now(), programs })
      return programs
    }
  }
  return []
}

/** Limpa os caches (chamado no /api/reload). */
function clearCache() {
  rawCache.clear()
  resultCache.clear()
}

export default { getNowNext, clearCache }
