// Servidor Express: serve o front-end estático, expõe a API normalizada
// (/api/*) e o proxy de streams (/stream). Os dados vêm da API pública do
// iptv-org (ver lib/data.js).

import express from 'express'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import data from './lib/data.js'
import proxy from './lib/proxy.js'
import epg from './lib/epg.js'

/** Compara dois tokens em tempo constante (evita timing attack). */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
// Token opcional para proteger o /api/reload. Se definido, o header
// `x-reload-token` precisa bater. Se não definido, o endpoint fica desabilitado.
const RELOAD_TOKEN = process.env.RELOAD_TOKEN

const app = express()
app.disable('x-powered-by')

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
    const result = await data.load()
    // Refresca também a confiança dinâmica do proxy e o cache de EPG, para que
    // um reload realmente reflita só o dataset atual.
    proxy.resetDynamicHosts()
    epg.clearCache()
    res.json({ ok: true, ...result, loadedAt: data.meta().loadedAt })
  } catch {
    res.status(502).json({ ok: false, error: 'Falha ao recarregar dados' })
  }
})

// --- Proxy de streams --------------------------------------------------------

app.get('/stream', proxy.createHandler(() => data.getHosts()))

// --- Front-end estático ------------------------------------------------------

app.use(express.static(path.join(__dirname, 'public')))

// --- Inicialização -----------------------------------------------------------

async function start() {
  console.log('Carregando dados da API pública do iptv-org...')
  const { total } = await data.load()
  console.log(`Pronto: ${total} streams normalizados.`)
  app.listen(PORT, () => {
    console.log(`IPTV Web rodando em http://localhost:${PORT}`)
  })
}

start().catch(err => {
  console.error('Falha ao iniciar:', err.message)
  process.exit(1)
})
