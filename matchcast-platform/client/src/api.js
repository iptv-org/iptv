export async function fetchPlaylist(url) {
  const res = await fetch(`http://localhost:5000/playlist?url=${encodeURIComponent(url)}`)
  return await res.text()
}

export function parseM3U(text) {
  const lines = text.split('\n')
  const items = []

  let current = {}

  for (let line of lines) {
    if (line.startsWith('#EXTINF')) {
      const name = line.split(',')[1] || 'Unknown'
      current = { name }
    } else if (line && !line.startsWith('#')) {
      current.url = line.trim()
      items.push(current)
      current = {}
    }
  }

  return items
}