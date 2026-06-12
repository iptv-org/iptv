// Orquestração: estado da UI, eventos, busca/filtros, paginação, player,
// favoritos, continuar assistindo, EPG, Picture-in-Picture, compartilhamento
// (deep link) e tema.

import { getMeta, getChannels, getEpg } from './api.js'
import { renderGrid, fillSelect, renderPlayerInfo, renderEpg } from './ui.js'
import { favoriteChannels, favoritesCount, setLastChannel, getLastChannel } from './store.js'
import * as player from './player.js'

const state = {
  search: '',
  category: '',
  country: '',
  language: '',
  nsfw: false,
  favoritesOnly: false,
  page: 1,
  pages: 1
}

let currentChannel = null
const $ = id => document.getElementById(id)

// ---- Carregamento da grade ----
async function load() {
  // Modo "só favoritos": render client-side a partir do armazenamento local.
  if (state.favoritesOnly) {
    const term = state.search.trim().toLowerCase()
    const items = favoriteChannels().filter(
      c => !term || c.name.toLowerCase().includes(term)
    )
    renderGrid($('grid'), $('empty'), items, openPlayer, onFavoriteToggled)
    if (items.length === 0) $('empty').textContent = 'Nenhum favorito ainda.'
    $('page-info').textContent = `${items.length} favorito(s)`
    $('prev').disabled = true
    $('next').disabled = true
    return
  }

  try {
    const data = await getChannels({
      search: state.search,
      category: state.category,
      country: state.country,
      language: state.language,
      nsfw: state.nsfw ? '1' : '',
      page: state.page,
      limit: 60
    })
    state.pages = data.pages || 1
    renderGrid($('grid'), $('empty'), data.items, openPlayer, onFavoriteToggled)
    $('empty').textContent = 'Nenhum canal encontrado.'
    $('page-info').textContent = data.total
      ? `Página ${data.page} de ${data.pages} · ${data.total} canais`
      : ''
    $('prev').disabled = data.page <= 1
    $('next').disabled = data.page >= data.pages
  } catch (err) {
    $('empty').hidden = false
    $('empty').textContent = `Erro ao carregar: ${err.message}`
  }
}

function onFavoriteToggled() {
  updateFavCount()
  // Em modo favoritos, recarrega para refletir remoções imediatamente.
  if (state.favoritesOnly) load()
}

function updateFavCount() {
  const n = favoritesCount()
  $('fav-count').textContent = n ? `(${n})` : ''
}

// ---- Player ----
async function openPlayer(channel) {
  currentChannel = channel
  $('player-panel').hidden = false
  renderPlayerInfo(channel)
  player.play(channel)
  setLastChannel(channel)
  refreshContinueButton()
  $('player-panel').scrollIntoView({ behavior: 'smooth', block: 'start' })

  // EPG (best-effort) — só se o canal tiver id de stream conhecido.
  if (channel.channel) {
    const streamId = `${channel.channel}@${channel.feed || ''}`
    const epg = await getEpg(streamId)
    // Garante que ainda estamos no mesmo canal antes de renderizar.
    if (currentChannel === channel) renderEpg(epg)
  }
}

function closePlayer() {
  player.destroy()
  currentChannel = null
  $('player-panel').hidden = true
  clearChannelHash()
}

// ---- Compartilhamento (deep link auto-contido no hash) ----
function buildShareUrl(channel) {
  const minimal = {
    id: channel.id,
    channel: channel.channel,
    feed: channel.feed,
    name: channel.name,
    url: channel.url,
    referrer: channel.referrer || null,
    userAgent: channel.userAgent || null,
    isHls: !!channel.isHls,
    quality: channel.quality || null,
    label: channel.label || null,
    categories: channel.categories || [],
    country: channel.country || null
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(minimal))))
  return `${location.origin}${location.pathname}#c=${encoded}`
}

function clearChannelHash() {
  if (location.hash.startsWith('#c=')) {
    history.replaceState(null, '', location.pathname + location.search)
  }
}

async function sharePlayer() {
  if (!currentChannel) return
  const url = buildShareUrl(currentChannel)
  history.replaceState(null, '', url)
  try {
    await navigator.clipboard.writeText(url)
    flashShare('🔗 Link copiado!')
  } catch {
    flashShare('🔗 Link na barra de endereço')
  }
}

function flashShare(msg) {
  const btn = $('player-share')
  const original = btn.textContent
  btn.textContent = msg
  setTimeout(() => (btn.textContent = original), 1800)
}

/** Abre um canal a partir de um deep link (#c=...), se presente. */
function openFromHash() {
  if (!location.hash.startsWith('#c=')) return false
  try {
    const json = decodeURIComponent(escape(atob(location.hash.slice(3))))
    const channel = JSON.parse(json)
    if (channel && channel.url) {
      openPlayer(channel)
      return true
    }
  } catch {
    /* hash inválido: ignora */
  }
  return false
}

// ---- Continuar assistindo ----
function refreshContinueButton() {
  const last = getLastChannel()
  const btn = $('continue-watching')
  if (last) {
    btn.hidden = false
    btn.textContent = `▶ Continuar: ${last.name}`
  } else {
    btn.hidden = true
  }
}

// ---- Filtros e busca ----
function resetToFirstPageAndLoad() {
  state.page = 1
  load()
}

function debounce(fn, ms) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

// ---- Tema ----
function initTheme() {
  const saved = localStorage.getItem('iptv-theme')
  if (saved) document.documentElement.dataset.theme = saved
  $('theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('iptv-theme', next)
  })
}

// ---- Inicialização ----
async function init() {
  initTheme()
  updateFavCount()
  refreshContinueButton()

  // Eventos de filtro.
  $('search').addEventListener(
    'input',
    debounce(e => {
      state.search = e.target.value
      resetToFirstPageAndLoad()
    }, 300)
  )
  $('filter-category').addEventListener('change', e => {
    state.category = e.target.value
    resetToFirstPageAndLoad()
  })
  $('filter-country').addEventListener('change', e => {
    state.country = e.target.value
    resetToFirstPageAndLoad()
  })
  $('filter-language').addEventListener('change', e => {
    state.language = e.target.value
    resetToFirstPageAndLoad()
  })
  $('filter-nsfw').addEventListener('change', e => {
    state.nsfw = e.target.checked
    resetToFirstPageAndLoad()
  })
  $('filter-favorites').addEventListener('change', e => {
    state.favoritesOnly = e.target.checked
    // Desabilita filtros do servidor enquanto em modo favoritos.
    for (const id of ['filter-category', 'filter-country', 'filter-language']) {
      $(id).disabled = e.target.checked
    }
    resetToFirstPageAndLoad()
  })

  // Paginação.
  $('prev').addEventListener('click', () => {
    if (state.page > 1) {
      state.page--
      load()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })
  $('next').addEventListener('click', () => {
    if (state.page < state.pages) {
      state.page++
      load()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })

  // Player.
  $('player-close').addEventListener('click', closePlayer)
  $('player-pip').addEventListener('click', () => player.togglePip())
  $('player-share').addEventListener('click', sharePlayer)
  $('continue-watching').addEventListener('click', () => {
    const last = getLastChannel()
    if (last) openPlayer(last)
  })

  // Metadados (categorias, países, idiomas) para os filtros.
  try {
    const meta = await getMeta()
    fillSelect(
      $('filter-category'),
      meta.categories.map(c => ({ value: c.id, label: `${c.name} (${c.count})` })),
      'Todas'
    )
    fillSelect(
      $('filter-country'),
      meta.countries.map(c => ({ value: c.code, label: `${c.flag || ''} ${c.name} (${c.count})` })),
      'Todos'
    )
    fillSelect(
      $('filter-language'),
      meta.languages.map(l => ({ value: l.code, label: `${l.name} (${l.count})` })),
      'Todos'
    )
    $('meta-info').textContent = `${meta.total.toLocaleString('pt-BR')} streams no total`
  } catch {
    console.warn('Falha ao carregar metadados')
  }

  // Deep link de canal (#c=...) tem prioridade sobre a grade inicial.
  openFromHash()
  await load()
}

init()
