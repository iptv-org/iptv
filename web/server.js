// Servidor Express: serve o front-end estático, expõe a API normalizada
// (/api/*) e o proxy de streams (/stream). Os dados vêm da API pública do
// iptv-org (ver lib/data.js).

import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import data from './lib/data.js'
import proxy from './lib/proxy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

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

// Recarrega os dados da API pública sob demanda (sem reiniciar o servidor).
app.post('/api/reload', async (req, res) => {
  try {
    const result = await data.load()
    res.json({ ok: true, ...result, loadedAt: data.meta().loadedAt })
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message })
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
