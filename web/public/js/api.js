// Cliente da API do back-end. Centraliza as chamadas fetch para /api/* e a
// construção da URL do proxy de streams.

export async function getMeta() {
  const res = await fetch('/api/meta')
  if (!res.ok) throw new Error('Falha ao carregar metadados')
  return res.json()
}

export async function getChannels(params = {}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) qs.set(key, value)
  }
  const res = await fetch(`/api/channels?${qs.toString()}`)
  if (!res.ok) throw new Error('Falha ao carregar canais')
  return res.json()
}

/**
 * Monta a URL do proxy para um stream, repassando os headers necessários.
 * Toda reprodução passa pelo proxy (resolve CORS, mixed-content e headers).
 */
export function streamUrl(channel) {
  const params = new URLSearchParams({ url: channel.url })
  if (channel.referrer) params.set('ref', channel.referrer)
  if (channel.userAgent) params.set('ua', channel.userAgent)
  return `/stream?${params.toString()}`
}
