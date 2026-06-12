// Renderização da interface. Toda construção é via DOM seguro (ver dom.js):
// nada de innerHTML com dados da API.

import { el, safeHttpUrl, clear } from './dom.js'
import { isFavorite, toggleFavorite } from './store.js'

/** Cria um card de canal. `onPlay` recebe o objeto do canal ao clicar. */
function card(channel, onPlay, onFavorite) {
  const logoUrl = safeHttpUrl(channel.logo)
  let logo
  if (logoUrl) {
    logo = el('img', {
      class: 'card-logo',
      src: logoUrl,
      alt: channel.name,
      loading: 'lazy'
    })
    // Se o logo falhar, troca por um placeholder.
    logo.addEventListener('error', () => logo.replaceWith(placeholderLogo()))
  } else {
    logo = placeholderLogo()
  }

  const badges = el('div', { class: 'badges' })
  if (channel.quality) badges.append(el('span', { class: 'badge', text: channel.quality }))
  if (channel.label) badges.append(el('span', { class: 'badge warn', text: channel.label }))

  const sub = el('div', { class: 'card-sub' })
  if (channel.country) {
    sub.append(document.createTextNode(`${channel.country.flag || ''} ${channel.country.name}`))
  } else {
    sub.append(document.createTextNode('—'))
  }

  // Botão de favorito (estrela), canto superior do card.
  const favBtn = el('button', {
    class: `fav-btn${isFavorite(channel.id) ? ' active' : ''}`,
    type: 'button',
    title: 'Favoritar',
    'aria-label': `Favoritar ${channel.name}`,
    text: isFavorite(channel.id) ? '★' : '☆'
  })
  favBtn.addEventListener('click', e => {
    e.stopPropagation() // não dispara o play
    const active = toggleFavorite(channel)
    favBtn.classList.toggle('active', active)
    favBtn.textContent = active ? '★' : '☆'
    if (onFavorite) onFavorite(channel, active)
  })

  const node = el(
    'div',
    { class: 'card', tabindex: '0', role: 'button', 'aria-label': `Assistir ${channel.name}` },
    [favBtn, logo, el('div', { class: 'card-title', text: channel.name }), sub, badges]
  )

  const trigger = () => onPlay(channel)
  node.addEventListener('click', trigger)
  node.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      trigger()
    }
  })
  return node
}

function placeholderLogo() {
  return el('div', { class: 'card-logo placeholder', text: '📺' })
}

/** Renderiza a grade de canais. */
export function renderGrid(gridEl, emptyEl, channels, onPlay, onFavorite) {
  clear(gridEl)
  emptyEl.hidden = channels.length > 0
  const frag = document.createDocumentFragment()
  for (const ch of channels) frag.append(card(ch, onPlay, onFavorite))
  gridEl.append(frag)
}

/** Preenche um <select> a partir de uma lista [{value, label}]. */
export function fillSelect(selectEl, items, firstLabel) {
  clear(selectEl)
  selectEl.append(el('option', { value: '', text: firstLabel }))
  for (const item of items) {
    selectEl.append(el('option', { value: item.value, text: item.label }))
  }
}

/** Atualiza o painel do player com título e selos do canal atual. */
export function renderPlayerInfo(channel) {
  document.getElementById('player-title').textContent = channel.name
  const badges = document.getElementById('player-badges')
  clear(badges)
  if (channel.quality) badges.append(el('span', { class: 'badge', text: channel.quality }))
  if (channel.label) badges.append(el('span', { class: 'badge warn', text: channel.label }))
  for (const c of channel.categories || [])
    badges.append(el('span', { class: 'badge', text: c.name }))
  if (channel.country) {
    badges.append(
      el('span', { class: 'badge', text: `${channel.country.flag || ''} ${channel.country.name}` })
    )
  }
  renderEpg({ available: false }) // limpa enquanto carrega
}

function fmtTime(ms) {
  return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Renderiza o guia "Agora/A seguir" (ou esconde se indisponível). */
export function renderEpg(epg) {
  const box = document.getElementById('player-epg')
  if (!box) return
  clear(box)
  if (!epg || !epg.available || !epg.programs?.length) {
    box.hidden = true
    return
  }
  box.hidden = false
  for (const p of epg.programs) {
    const time = el('span', { class: 'epg-time', text: fmtTime(p.start) })
    const title = el('span', { class: 'epg-title', text: p.title })
    const row = el('div', { class: `epg-row${p.isNow ? ' now' : ''}` }, [
      el('span', { class: 'epg-tag', text: p.isNow ? 'AGORA' : 'A seguir' }),
      time,
      title
    ])
    box.append(row)
  }
}
