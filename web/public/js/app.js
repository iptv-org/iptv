// Orquestração: estado da UI, eventos, busca/filtros com debounce, paginação,
// player e tema.

import { getMeta, getChannels } from './api.js'
import { renderGrid, fillSelect, renderPlayerInfo } from './ui.js'
import * as player from './player.js'

const state = {
  search: '',
  category: '',
  country: '',
  language: '',
  nsfw: false,
  page: 1,
  pages: 1
}

const $ = id => document.getElementById(id)

// ---- Carregamento da grade ----
async function load() {
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
    renderGrid($('grid'), $('empty'), data.items, openPlayer)
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

// ---- Player ----
function openPlayer(channel) {
  $('player-panel').hidden = false
  renderPlayerInfo(channel)
  player.play(channel)
  $('player-panel').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function closePlayer() {
  player.destroy()
  $('player-panel').hidden = true
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

  $('player-close').addEventListener('click', closePlayer)

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
  } catch (err) {
    console.warn('Falha ao carregar metadados:', err)
    /* segue mesmo sem metadados */
  }

  await load()
}

init()
