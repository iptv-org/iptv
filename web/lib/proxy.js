// Proxy de streams. Resolve três problemas que impedem a reprodução direta no
// navegador: (1) ausência de CORS na maioria dos servidores, (2) mixed-content
// (http em página https) e (3) headers Referer/User-Agent que o navegador não
// consegue enviar via JS.
//
// Segurança:
//  - Só repassa para hosts presentes na allowlist (hosts vistos no dataset, mais
//    hosts referenciados por playlists já confiáveis). Evita virar proxy aberto.
//  - Bloqueia destinos internos/privados (proteção contra SSRF).
//  - Só aceita http/https.

import { Readable } from 'node:stream'
import net from 'node:net'

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const FETCH_TIMEOUT_MS = 15000
const MAX_REDIRECTS = 5
const MAX_DYNAMIC_HOSTS = 5000

// Hosts descobertos em tempo de execução a partir de playlists confiáveis
// (ex.: segmentos hospedados em CDN diferente da playlist). Cresce só a partir
// de conteúdo já autorizado e tem um teto para não expandir indefinidamente.
const dynamicHosts = new Set()

/** Memoriza um host referenciado por uma playlist confiável, respeitando o teto. */
function rememberDynamicHost(host) {
  if (!host) return
  const h = host.toLowerCase()
  if (!dynamicHosts.has(h) && dynamicHosts.size >= MAX_DYNAMIC_HOSTS) return
  dynamicHosts.add(h)
}

/** Limpa a allowlist dinâmica (útil em testes ou reload). */
function resetDynamicHosts() {
  dynamicHosts.clear()
}

/** Verifica se um IP literal pertence a uma faixa privada/reservada. */
function isPrivateIp(host) {
  if (net.isIP(host) === 0) return false // não é um IP literal
  // IPv4 privados/reservados e loopback.
  if (/^127\./.test(host)) return true
  if (/^10\./.test(host)) return true
  if (/^192\.168\./.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true
  if (/^169\.254\./.test(host)) return true // link-local / metadata cloud
  if (/^0\./.test(host)) return true
  // IPv6 loopback / link-local / ULA.
  const h = host.toLowerCase()
  if (h === '::1' || h === '::') return true
  if (h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true
  return false
}

/**
 * Decide se um host pode ser acessado pelo proxy.
 * @param {string} host hostname do destino
 * @param {Set<string>} allowlist hosts do dataset
 */
function isAllowed(host, allowlist) {
  if (!host) return false
  const lower = host.toLowerCase()
  if (lower === 'localhost') return false
  if (isPrivateIp(lower)) return false
  return allowlist.has(host) || dynamicHosts.has(host)
}

/** Monta a URL do próprio proxy preservando os headers necessários. */
function proxyUrl(target, { referrer, userAgent }) {
  const params = new URLSearchParams({ url: target })
  if (referrer) params.set('ref', referrer)
  if (userAgent) params.set('ua', userAgent)
  return `/stream?${params.toString()}`
}

/**
 * Faz fetch revalidando cada salto de redirect contra a allowlist. Sem isso, um
 * host autorizado poderia redirecionar para um destino interno/privado (SSRF).
 */
async function fetchValidated(initialUrl, { headers, signal, allowlist }) {
  let current = initialUrl
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, { headers, redirect: 'manual', signal })
    // Não é um redirect → resposta final.
    if (res.status < 300 || res.status >= 400) return res
    const location = res.headers.get('location')
    if (!location) return res
    const next = new URL(location, current)
    if (next.protocol !== 'http:' && next.protocol !== 'https:') {
      throw new Error('Redirect para protocolo não suportado')
    }
    if (!isAllowed(next.hostname, allowlist)) {
      throw new Error('Redirect para host não permitido')
    }
    current = next.toString()
  }
  throw new Error('Muitos redirects')
}

/** Detecta se o conteúdo é uma playlist HLS (m3u8). */
function isPlaylist(contentType, url) {
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('mpegurl')) return true
  if (ct.includes('application/x-mpegurl') || ct.includes('vnd.apple.mpegurl')) return true
  return /\.m3u8(\?|$)/i.test(url)
}

/**
 * Reescreve as URIs de uma playlist m3u8 para que segmentos, sub-playlists,
 * chaves e mapas de inicialização também passem pelo proxy.
 */
function rewritePlaylist(text, baseUrl, headers) {
  const base = new URL(baseUrl)
  const resolve = ref => {
    try {
      const abs = new URL(ref, base).toString()
      const host = new URL(abs).hostname
      // Confia em hosts referenciados por uma playlist já autorizada.
      rememberDynamicHost(host)
      return proxyUrl(abs, headers)
    } catch {
      return ref
    }
  }

  return text
    .split(/\r?\n/)
    .map(line => {
      const trimmed = line.trim()
      if (trimmed === '') return line
      // Atributos URI="..." (EXT-X-KEY, EXT-X-MAP, EXT-X-MEDIA, etc.).
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${resolve(uri)}"`)
      }
      // Linha de URI de segmento ou sub-playlist.
      return resolve(trimmed)
    })
    .join('\n')
}

/**
 * Handler Express do proxy: GET /stream?url=...&ref=...&ua=...
 * @param {Set<string>} allowlist
 */
function createHandler(getAllowlist) {
  return async function handler(req, res) {
    const target = req.query.url
    if (!target || typeof target !== 'string') {
      res.status(400).json({ error: 'Parâmetro "url" é obrigatório' })
      return
    }

    let parsed
    try {
      parsed = new URL(target)
    } catch {
      res.status(400).json({ error: 'URL inválida' })
      return
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.status(400).json({ error: 'Protocolo não suportado' })
      return
    }

    if (!isAllowed(parsed.hostname, getAllowlist())) {
      res.status(403).json({ error: 'Host não permitido' })
      return
    }

    const headers = {
      referrer: typeof req.query.ref === 'string' ? req.query.ref : undefined,
      userAgent: typeof req.query.ua === 'string' ? req.query.ua : undefined
    }

    const outboundHeaders = {
      'User-Agent': headers.userAgent || DEFAULT_UA,
      Accept: '*/*'
    }
    if (headers.referrer) outboundHeaders.Referer = headers.referrer
    // Repassa o Range para suportar seek em segmentos.
    if (req.headers.range) outboundHeaders.Range = req.headers.range

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const upstream = await fetchValidated(target, {
        headers: outboundHeaders,
        signal: controller.signal,
        allowlist: getAllowlist()
      })

      const contentType = upstream.headers.get('content-type') || ''

      if (isPlaylist(contentType, target)) {
        const text = await upstream.text()
        const rewritten = rewritePlaylist(text, upstream.url || target, headers)
        res.status(upstream.status)
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 'no-store')
        res.send(rewritten)
        return
      }

      // Segmentos / chaves / outros binários: repassa o stream cru.
      res.status(upstream.status)
      res.setHeader('Access-Control-Allow-Origin', '*')
      for (const h of ['content-type', 'content-length', 'accept-ranges', 'content-range']) {
        const v = upstream.headers.get(h)
        if (v) res.setHeader(h, v)
      }

      if (upstream.body) {
        Readable.fromWeb(upstream.body).pipe(res)
      } else {
        res.end()
      }
    } catch (err) {
      if (!res.headersSent) {
        const aborted = err.name === 'AbortError'
        res.status(aborted ? 504 : 502).json({
          error: aborted ? 'Tempo esgotado ao acessar o stream' : 'Falha ao acessar o stream'
        })
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}

export default { createHandler, resetDynamicHosts }
