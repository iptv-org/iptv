// Servidor Express: serve o front-end estático, expõe a API normalizada
// (/api/*) e o proxy de streams (/stream). Os dados vêm da API pública do
// iptv-org (ver lib/data.js). Preparado para produção: healthcheck, headers de
// segurança, rate-limit no proxy, atualização periódica e shutdown gracioso.

import express from 'express'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import data from './lib/data.js'
import proxy from './lib/proxy.js'
import epg from './lib/epg.js'

/**
 * Compara dois tokens em tempo constante (evita timing attack). Compara hashes
 * de tamanho fixo para não vazar nem o comprimento do token.
 */
function safeEqual(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest()
  const hashB = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'
// Token opcional para proteger o /api/reload. Se definido, o header
// `x-reload-token` precisa bater. Se não definido, o endpoint fica desabilitado.
const RELOAD_TOKEN = process.env.RELOAD_TOKEN
// Atualização automática do dataset (minutos). 0 desabilita. Padrão: 6 h.
const REFRESH_INTERVAL_MIN = parseInt(process.env.REFRESH_INTERVAL_MIN || '360', 10)
// Confia no X-Forwarded-* (IP/protocolo reais) só quando atrás de um proxy
// reverso confiável. Em execução direta, deixe desligado — senão um cliente
// poderia forjar X-Forwarded-For e burlar o rate-limit por IP.
const TRUST_PROXY = process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', TRUST_PROXY ? 1 : 0)

// --- Headers de segurança ----------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  next()
})

// --- Rate-limit simples (janela fixa por IP) para o proxy --------------------
// O /stream é a superfície de abuso pública; limitamos por IP. O limite é
// generoso para não atrapalhar a reprodução HLS (muitos segmentos por minuto).
const RATE_WINDOW_MS = 60_000
const RATE_MAX = parseInt(process.env.STREAM_RATE_MAX || '600', 10)
const rateHits = new Map()

function rateLimit(req, res, next) {
  const now = Date.now()
  const ip = req.ip || 'unknown'
  const rec = rateHits.get(ip)
  if (!rec || now > rec.reset) {
    rateHits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS })
    return next()
  }
  if (rec.count >= RATE_MAX) {
    res.status(429).json({ error: 'Muitas requisições, tente novamente em instantes' })
    return
  }
  rec.count++
  next()
}

// Limpeza periódica das janelas expiradas (evita crescimento do mapa).
const rateSweep = setInterval(() => {
  const now = Date.now()
  for (const [ip, rec] of rateHits) if (now > rec.reset) rateHits.delete(ip)
}, RATE_WINDOW_MS)
rateSweep.unref()

// --- Healthcheck -------------------------------------------------------------
app.get('/healthz', (req, res) => {
  const meta = data.meta()
  const ok = meta.total > 0
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'starting',
    streams: meta.total,
    loadedAt: meta.loadedAt
  })
})

// --- API normalizada ---------------------------------------------------------

// Metadados: total + listas de categorias, países e idiomas (com contagem).
app.get('/api/meta', (req, res) => {
  res.json(data.meta())
})

// Lista de canais filtrada e paginada.
app.get('/api/channels', (req, res) => {
  const { search, category, country, language, page, limit } = req.query
  const includeNsfw = req.query.nsfw === '1'
  res.json(data.query({ search, category, country, language, includeNsfw, page, limit }))
})

// Guia de programação (EPG) "Agora/A seguir" para um stream. Best-effort: se a
// fonte externa de XMLTV não estiver disponível, devolve { available: false }.
app.get('/api/epg', async (req, res) => {
  const streamId = typeof req.query.stream === 'string' ? req.query.stream : ''
  const guide = data.getGuideForStream(streamId)
  if (!guide) {
    res.json({ available: false })
    return
  }
  try {
    const programs = await epg.getNowNext(guide)
    res.json({ available: programs.length > 0, programs })
  } catch {
    res.json({ available: false })
  }
})

// Recarrega os dados da API pública sob demanda (sem reiniciar o servidor).
// Protegido por token: sem RELOAD_TOKEN definido, ou com token incorreto,
// responde 403 — evita abuso forçando downloads externos repetidos.
app.post('/api/reload', async (req, res) => {
  if (!RELOAD_TOKEN || !safeEqual(req.get('x-reload-token') || '', RELOAD_TOKEN)) {
    res.status(403).json({ ok: false, error: 'Forbidden' })
    return
  }
  try {
    const result = await reloadData()
    res.json({ ok: true, ...result, loadedAt: data.meta().loadedAt })
  } catch {
    res.status(502).json({ ok: false, error: 'Falha ao recarregar dados' })
  }
})

// --- Proxy de streams --------------------------------------------------------

app.get('/stream', rateLimit, proxy.createHandler(() => data.getHosts()))

// --- Front-end estático ------------------------------------------------------

app.use(express.static(path.join(__dirname, 'public')))

// --- Dados / inicialização ---------------------------------------------------

// Garante que recargas concorrentes (POST /api/reload + refresh periódico) não
// disparem data.load() em paralelo nem intercalem os resets de cache.
let reloadInFlight = null

/** Recarrega o dataset e refresca a confiança dinâmica do proxy e o cache EPG. */
async function reloadData() {
  if (reloadInFlight) return reloadInFlight
  reloadInFlight = (async () => {
    const result = await data.load()
    proxy.resetDynamicHosts()
    epg.clearCache()
    return result
  })().finally(() => {
    reloadInFlight = null
  })
  return reloadInFlight
}

async function start() {
  console.log('Carregando dados da API pública do iptv-org...')
  const { total } = await data.load()
  console.log(`Pronto: ${total} streams normalizados.`)

  // Atualização periódica do dataset (mantém o catálogo fresco em produção).
  if (REFRESH_INTERVAL_MIN > 0) {
    const timer = setInterval(() => {
      reloadData()
        .then(r => console.log(`Dataset atualizado: ${r.total} streams.`))
        .catch(err => console.error('Falha ao atualizar dataset:', err.message))
    }, REFRESH_INTERVAL_MIN * 60_000)
    timer.unref()
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`IPTV Web rodando em http://${HOST}:${PORT}`)
  })

  // Shutdown gracioso (plataformas enviam SIGTERM ao reciclar o container).
  const shutdown = signal => {
    console.log(`Recebido ${signal}, encerrando...`)
    server.close(() => process.exit(0))
    // Força a saída se as conexões não fecharem a tempo.
    setTimeout(() => process.exit(0), 10_000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start().catch(err => {
  console.error('Falha ao iniciar:', err.message)
  process.exit(1)
})
