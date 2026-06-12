// Persistência local (localStorage): favoritos e "continuar assistindo".
// Tudo client-side, sem backend — funciona offline e respeita a privacidade.

const FAV_KEY = 'iptv-favorites'
const LAST_KEY = 'iptv-last-channel'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* cota cheia ou indisponível: ignora */
  }
}

// --- Favoritos (mapa id -> objeto do canal, para render offline) ---

// Migra formato antigo (array de ids) se existir; senão usa objeto {id: channel}.
const rawFav = readJson(FAV_KEY, {})
const favorites = new Map(
  Array.isArray(rawFav) ? [] : Object.entries(rawFav)
)

function persistFavorites() {
  writeJson(FAV_KEY, Object.fromEntries(favorites))
}

export function isFavorite(id) {
  return favorites.has(id)
}

/** Alterna o favorito a partir do objeto do canal. Retorna o novo estado. */
export function toggleFavorite(channel) {
  if (favorites.has(channel.id)) favorites.delete(channel.id)
  else favorites.set(channel.id, channel)
  persistFavorites()
  return favorites.has(channel.id)
}

/** Lista os canais favoritados (objetos completos). */
export function favoriteChannels() {
  return [...favorites.values()]
}

export function favoritesCount() {
  return favorites.size
}

// --- Último canal assistido (continuar assistindo) ---

export function setLastChannel(channel) {
  if (!channel) return
  // Guarda só o necessário para reabrir o player.
  writeJson(LAST_KEY, {
    id: channel.id,
    name: channel.name,
    url: channel.url,
    referrer: channel.referrer || null,
    userAgent: channel.userAgent || null,
    isHls: !!channel.isHls,
    quality: channel.quality || null,
    label: channel.label || null,
    logo: channel.logo || '',
    categories: channel.categories || [],
    country: channel.country || null,
    languages: channel.languages || []
  })
}

export function getLastChannel() {
  return readJson(LAST_KEY, null)
}
