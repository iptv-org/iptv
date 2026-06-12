// Wrapper do player HLS. Usa hls.js quando disponível e cai para o suporte
// nativo (Safari/iOS) quando o navegador já entende HLS. Valida a URL antes de
// entregar ao elemento <video>.

import { streamUrl } from './api.js'
import { safeHttpUrl } from './dom.js'

let hls = null

const video = () => document.getElementById('video')
const statusEl = () => document.getElementById('player-status')

function showStatus(message) {
  const s = statusEl()
  if (!message) {
    s.hidden = true
    s.textContent = ''
  } else {
    s.hidden = false
    s.textContent = message
  }
}

/** Alterna o modo Picture-in-Picture (quando suportado pelo navegador). */
export async function togglePip() {
  const v = video()
  if (!document.pictureInPictureEnabled || !v) return
  try {
    if (document.pictureInPictureElement) await document.exitPictureInPicture()
    else await v.requestPictureInPicture()
  } catch {
    /* gesto do usuário ausente ou sem suporte: ignora */
  }
}

/** Destrói qualquer instância anterior do hls.js e zera o vídeo. */
export function destroy() {
  if (hls) {
    hls.destroy()
    hls = null
  }
  const v = video()
  if (v) {
    v.removeAttribute('src')
    v.load()
  }
}

/**
 * Reproduz um canal. A URL real do stream nunca vai direto ao <video>: passa
 * pelo proxy do back-end (streamUrl), que resolve CORS/headers.
 */
export function play(channel) {
  destroy()
  const v = video()

  // A URL do proxy é same-origin; ainda assim validamos o formato.
  const src = safeHttpUrl(window.location.origin + streamUrl(channel))
  if (!src) {
    showStatus('URL de stream inválida.')
    return
  }

  showStatus('Carregando…')

  const onPlaying = () => showStatus(null)
  v.addEventListener('playing', onPlaying, { once: true })

  // Suporte nativo a HLS (Safari, iOS) ou stream não-HLS.
  const nativeHls = v.canPlayType('application/vnd.apple.mpegurl')
  if (nativeHls || !channel.isHls) {
    v.src = src
    v.play().catch(() => showStatus('Não foi possível iniciar a reprodução.'))
    return
  }

  // hls.js para os demais navegadores.
  if (window.Hls && window.Hls.isSupported()) {
    hls = new window.Hls({ maxBufferLength: 20, manifestLoadingTimeOut: 15000 })
    hls.loadSource(src)
    hls.attachMedia(v)
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      v.play().catch(() => showStatus('Clique em ▶ para iniciar.'))
    })
    hls.on(window.Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) {
        destroy()
        showStatus('Stream indisponível (offline, geo-bloqueado ou sem suporte).')
      }
    })
    return
  }

  showStatus('Seu navegador não suporta este formato de stream.')
}
