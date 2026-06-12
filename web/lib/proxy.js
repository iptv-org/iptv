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
import dns from 'node:dns/promises'

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

/**
 * Verifica se um IP literal pertence a uma faixa privada/reservada/especial.
 * Aceita o hostname como vem de URL.hostname (IPv6 chega entre colchetes, ex.
 * "[::1]"), normaliza e cobre também IPv4 embutido em IPv6 (::ffff:127.0.0.1).
 */
function isPrivateIp(host) {
  // URL.hostname devolve IPv6 entre colchetes; remove para o net.isIP funcionar.
  let h = host.toLowerCase()
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1)

  const family = net.isIP(h)
  if (family === 0) return false // não é um IP literal

  // IPv6: extrai um eventual IPv4 embutido para checar abaixo.
  if (family === 6) {
    if (h === '::1' || h === '::') return true // loopback / unspecified
    if (/^fe[89ab][0-9a-f]?:/i.test(h)) return true // link-local fe80::/10
    if (h.startsWith('fc') || h.startsWith('fd')) return true // ULA (fc00::/7)
    // IPv4-mapeado, tanto na forma com pontos (::ffff:127.0.0.1) quanto hex
    // (::ffff:7f00:1). Variações mapeadas não reconhecidas falham fechado.
    const dotted = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
    const hex = h.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)
    if (dotted) {
      h = dotted[1]
    } else if (hex) {
      const hi = parseInt(hex[1], 16)
      const lo = parseInt(hex[2], 16)
      h = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`
    } else if (h.startsWith('::ffff:')) {
      return true // fail-closed
    } else {
      return false
    }
  }

  // IPv4 privados/reservados/especiais.
  if (/^127\./.test(h)) return true // loopback
  if (/^10\./.test(h)) return true // privado
  if (/^192\.168\./.test(h)) return true // privado
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true // privado
  if (/^169\.254\./.test(h)) return true // link-local / metadata cloud
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true // CGNAT 100.64/10
  if (/^(0|192\.0\.0|192\.0\.2|198\.51\.100|203\.0\.113)\./.test(h)) return true // reservados/TEST-NET
  if (/^198\.1[89]\./.test(h)) return true // benchmark 198.18/15
  if (/^(22[4-9]|23\d)\./.test(h)) return true // multicast 224.0.0.0/4
  if (/^(24\d|25[0-5])\./.test(h)) return true // reservado 240.0.0.0/4 (inclui broadcast)
  return false
}

/**
 * Decide se um host pode ser acessado pelo proxy.
 * @param {string} host hostname do destino
 * @param {Set<string>} allowlist hosts do dataset
 */
function isAllowed(host, allowlist) {
  if (!host) return false
  // Normaliza ponto final (FQDN absoluto): "localhost." e "host." equivalem a
  // "localhost"/"host" para o resolvedor, então não podem burlar as checagens.
  const lower = host.toLowerCase().replace(/\.+$/, '')
  if (lower === 'localhost' || lower.endsWith('.localhost')) return false
  if (isPrivateIp(lower)) return false
  return allowlist.has(lower) || dynamicHosts.has(lower)
}

/** Monta a URL do próprio proxy preservando os headers necessários. */
function proxyUrl(target, { referrer, userAgent }) {
  const params = new URLSearchParams({ url: target })
  if (referrer) params.set('ref', referrer)
  if (userAgent) params.set('ua', userAgent)
  return `/stream?${params.toString()}`
}

/**
 * Resolve um hostname e indica se algum endereço aponta para IP privado.
 * Mitiga DNS rebinding: um domínio allowlistado cujo registro DNS aponte para
 * um IP interno é bloqueado. (IPs literais já são cobertos por isPrivateIp.)
 */
async function resolvesToPrivate(hostname) {
  let h = hostname
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1)
  if (net.isIP(h) !== 0) return false // IP literal: coberto por isPrivateIp
  try {
    const records = await dns.lookup(h, { all: true })
    return records.some(record => isPrivateIp(record.address))
  } catch {
    return false // falha de resolução: deixa o fetch tratar o erro
  }
}

/**
 * Faz fetch revalidando cada salto de redirect contra a allowlist e resolvendo
 * o DNS para barrar destinos que apontem a IP privado. Sem isso, um host
 * autorizado poderia redirecionar (ou rebind) para um destino interno (SSRF).
 */
async function fetchValidated(initialUrl, { headers, signal, allowlist }) {
  let current = initialUrl
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (await resolvesToPrivate(new URL(current).hostname)) {
      throw new Error('Destino resolve para IP privado')
    }
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

export default { createHandler, resetDynamicHosts, isPrivateIp, resolvesToPrivate }
