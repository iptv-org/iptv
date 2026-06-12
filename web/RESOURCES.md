# Recursos IPTV — contexto curado

Compilado a partir do [awesome-iptv](https://github.com/iptv-org/awesome-iptv)
(licença CC0), filtrando apenas o que é **relevante, legal e acionável** para
este projeto (catálogo de canais públicos + player). Serve de mapa para evoluir
o site: o que já foi implementado, o que pode ser integrado e onde buscar dados.

> ⚖️ Apenas recursos de **canais públicos/gratuitos**. Nada aqui se destina a
> retransmitir conteúdo protegido por direitos autorais.

## ✅ Já implementado neste site

| Recurso | Inspiração (awesome-iptv) |
| --- | --- |
| Player HLS no navegador (hls.js + fallback nativo) | Web players (IPTVnator, Pleyr, hlstv.app) |
| Catálogo com busca e filtros (categoria/país/idioma) | TV Explorer, FluxCast |
| Favoritos | TiviMate, Opus, StreamVault |
| Continuar assistindo (último canal) | TV Tuner |
| EPG "Agora/A seguir" | EPG Sources + `@iptv/xmltv` |
| Picture-in-Picture | Live TV, Another IPTV Player |
| PWA instalável + offline shell | Ellipto IPTV, EBK IPTV |
| Compartilhar canal (deep link) | TV Explorer (share) |
| Proxy com reescrita de HLS + headers | hls-restream-proxy, HLS Proxy Worker |
| Tema claro/escuro, layout responsivo | — |

## 🗓️ Fontes de EPG (programação)

A programação real vem de arquivos **XMLTV** externos. Este projeto já consome
os mapeamentos de `guides.json` da API do iptv-org. Fontes adicionais úteis:

- [iptv-org/epg](https://github.com/iptv-org/epg) — grabber oficial de EPG (a base do `guides.json`).
- [EPGShare01](https://epgshare01.online/) — guias para vários países.
- [Open EPG](https://www.open-epg.com/) — EPG grátis por país.
- [EPG.pw](https://epg.pw/) · [epg.best](https://epg.best/) — provedores de EPG.
- [i.mjh.nz](http://i.mjh.nz/) — AU/NZ/ZA. [epg.51zmt.top](http://epg.51zmt.top:8000/) — China.

> Apontar para outra base: `IPTV_API_BASE` define a origem dos dados (inclui `guides.json`).

## 🗄️ Datasets de canais e logos (enriquecimento futuro)

Para complementar metadados/logos quando faltarem na base do iptv-org:

- [Picons](https://github.com/picons/picons) · [fanmingming/live](https://github.com/fanmingming/live) — coleções de logos.
- [LyngSat](https://www.lyngsat.com/) / [LyngSat Logo](https://www.lyngsat-logo.com/) — base de canais e logos por satélite.
- [TVCL](https://www.tvchannellists.com/) — listagens de canais por região.

## 📡 Outras listas públicas (fontes alternativas de streams)

Além do iptv-org, listas públicas que poderiam ser oferecidas como origem opcional:

- [Free-TV/IPTV](https://github.com/Free-TV/IPTV) — playlist M3U de canais gratuitos.
- [M3UPT](https://m3upt.com/) — lista legal de Portugal.
- [TDTChannels](https://www.tdtchannels.com/) — Espanha e internacional.

## 👨🏻‍💻 Bibliotecas úteis (Node)

Se algum recurso evoluir para depender de parsing mais robusto:

- [`@iptv/xmltv`](https://www.npmjs.com/package/@iptv/xmltv) — parser/gerador XMLTV (substituiria o parser mínimo de `lib/epg.js`).
- [`@iptv/playlist`](https://www.npmjs.com/package/@iptv/playlist) — parser/gerador M3U.
- [`iptv-checker`](https://www.npmjs.com/package/iptv-checker) — checagem de saúde de streams (base para um indicador "online/offline").
- [xTeVe](https://github.com/xteve-project/xTeVe) / [Threadfin](https://github.com/Threadfin/Threadfin) — proxies M3U para Plex/Jellyfin/Emby.

## 🧭 Próximos passos sugeridos (não implementados)

Ideias de alto valor extraídas da lista, ordenadas por esforço:

1. **Indicador de saúde do stream** — endpoint `/api/check?url=` (HEAD/GET via proxy) + selo online/offline no card. Base: `iptv-checker`.
2. **Importar playlist M3U própria** — colar uma URL M3U; o back-end parseia e serve como lista. ⚠️ exige expandir a allowlist do proxy de forma controlada (opt-in por host do usuário) para não enfraquecer a proteção anti-SSRF.
3. **Multiview** — assistir vários canais em grade. Base: TV Explorer, VidGrid.
4. **Chromecast/AirPlay** — Remote Playback API / Cast SDK.
5. **EPG robusto** — trocar o parser mínimo por `@iptv/xmltv` e exibir uma grade de horários completa.
