// Service worker: cache do "app shell" para carregamento rápido e uso offline
// básico. NÃO cacheia respostas de /api/* nem /stream (dados ao vivo) — só os
// arquivos estáticos da interface.

const CACHE = 'iptv-web-v3'
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/api.js',
  './js/ui.js',
  './js/dom.js',
  './js/player.js',
  './js/store.js',
  './manifest.webmanifest',
  './icon.svg',
  './logo.png',
  './icon.png'
]
// Nova versão do cache porque o app shell mudou (logo no header).

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Remove só versões antigas DESTE app (prefixo iptv-web-), preservando caches
  // de outros fluxos que compartilhem a mesma origin.
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(k => k.startsWith('iptv-web-') && k !== CACHE).map(k => caches.delete(k))
        )
      )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Nunca intercepta dados ao vivo nem origens externas.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/stream')) return

  // App shell: cache-first com atualização em segundo plano.
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone()
            // waitUntil mantém o SW vivo até a gravação concluir.
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
