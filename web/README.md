<p align="center">
  <img src="public/banner.png" alt="IPTV Web" width="760" />
</p>

# IPTV Web

Site que consome os dados **públicos** do projeto [iptv-org](https://github.com/iptv-org/iptv)
e os apresenta como uma plataforma de IPTV: catálogo de canais com logos, busca,
filtros (categoria, país, idioma) e player HLS no navegador.

## Funcionalidades

- 📺 **Catálogo** com logos, busca e filtros por categoria, país e idioma.
- ▶️ **Player HLS** (hls.js + fallback nativo no Safari) via proxy.
- ⭐ **Favoritos** e aba "Só favoritos" (salvos no navegador).
- 🕘 **Continuar assistindo** — reabre o último canal.
- 🗓️ **EPG "Agora/A seguir"** (best-effort, a partir das fontes XMLTV do `guides.json`).
- 🖼️ **Picture-in-Picture** e 🔗 **compartilhar canal** (link auto-contido).
- 📱 **PWA** — instalável, com cache do app shell para carregamento rápido/offline.
- 🌗 Tema claro/escuro e layout responsivo.

Veja [`RESOURCES.md`](RESOURCES.md) para o contexto curado (fontes de EPG,
datasets, bibliotecas) e próximos passos.

> Apenas canais **públicos e gratuitos** (licença CC0). Nenhum conteúdo é
> armazenado — o site apenas organiza e reproduz links já publicamente
> disponíveis. Não é, e não deve ser usado como, um serviço de retransmissão de
> canais protegidos por direitos autorais.

## Arquitetura

```
web/
├── server.js          Express: serve o front-end, /api/* e o proxy /stream
├── lib/
│   ├── data.js        Busca os JSON da API pública, normaliza e cacheia em memória
│   ├── proxy.js       Proxy de streams (CORS, mixed-content, headers, anti-SSRF)
│   └── epg.js         EPG "Agora/A seguir" (XMLTV, best-effort, com cache)
└── public/            Front-end estático (vanilla JS + hls.js) + PWA
    ├── index.html
    ├── manifest.webmanifest · sw.js · icon.svg
    ├── css/styles.css
    └── js/{app,ui,player,api,dom,store}.js
```

**Por que um back-end?** Um site puramente front-end falha na maioria dos
streams porque os servidores de origem normalmente não enviam cabeçalhos CORS,
muitos usam `http://` (mixed-content numa página `https://`) e alguns exigem
headers `Referer`/`User-Agent` que o navegador não consegue enviar via JS. O
back-end resolve os três pontos atuando como proxy.

## De onde vêm os dados

Por padrão, da API pública hospedada:

- `https://iptv-org.github.io/api/streams.json` (e `channels`, `categories`,
  `countries`, `languages`, `logos`, `feeds`).

Os dados **não são hardcoded**: são baixados e normalizados a cada inicialização
(e podem ser recarregados em tempo real via `POST /api/reload`). Se a lista do
repositório mudar, o site reflete na próxima carga.

Para apontar para outra origem (ex.: uma instância própria da API ou um mirror),
defina a variável de ambiente:

```sh
IPTV_API_BASE=https://sua-instancia/api npm start
```

## Como rodar

Pré-requisitos: **Node.js 18.11+** (o script `dev` usa `node --watch`; testado no Node 22).

```sh
cd web
npm install      # instala o express
npm run dev      # modo desenvolvimento (reinicia ao salvar)
# ou
npm start        # modo produção
```

Acesse **http://localhost:3000**.

Para mudar a porta: `PORT=8080 npm start`.

## Deploy (produção)

O `web/` já vem pronto para produção: `Dockerfile`, healthcheck em `/healthz`,
shutdown gracioso, headers de segurança, rate-limit no proxy e atualização
periódica do dataset. Variáveis de ambiente em [`.env.example`](.env.example).

> ⚠️ Precisa de um host com **runtime Node + saída de internet** (para baixar os
> dados do iptv-org). GitHub Pages **não serve** (é estático) — use Render, Fly.io,
> Railway, Cloud Run, etc.

### Docker (qualquer host)

```sh
cd web
docker build -t iptv-web .
docker run -p 3000:3000 iptv-web
```

### Render (1 clique, free tier)

1. Faça push deste repositório para o seu GitHub.
2. No [Render](https://render.com): **New → Blueprint** e selecione o repo. O
   `render.yaml` na **raiz** do repositório configura o serviço automaticamente
   (`rootDir: web`, build via `web/Dockerfile`).
3. Deploy. O healthcheck `/healthz` confirma quando estiver no ar.

### Fly.io

```sh
cd web
fly launch --no-deploy   # ajusta o nome do app no fly.toml
fly deploy
```

### Railway / Cloud Run

Apontam direto para o `Dockerfile`. Defina `PORT` conforme a plataforma
(o servidor respeita `PORT` e escuta em `0.0.0.0`).

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta (a plataforma costuma definir) |
| `HOST` | `0.0.0.0` | Interface de escuta |
| `IPTV_API_BASE` | API pública do iptv-org | Origem dos dados |
| `TRUST_PROXY` | `0` | Confiar no `X-Forwarded-*` (ative `1` atrás de proxy reverso) |
| `REFRESH_INTERVAL_MIN` | `360` | Atualização automática do dataset (min; `0` desliga) |
| `STREAM_RATE_MAX` | `600` | Limite de req/min por IP no `/stream` |
| `RELOAD_TOKEN` | — | Habilita `POST /api/reload` (header `x-reload-token`) |

## API interna (back-end)

| Rota | Descrição |
| --- | --- |
| `GET /healthz` | Healthcheck — `200` quando os dados carregaram (`{status, streams, loadedAt}`) |
| `GET /api/meta` | Total + categorias, países e idiomas (com contagem) para os filtros |
| `GET /api/channels` | Lista filtrada/paginada. Query: `search`, `category`, `country`, `language`, `nsfw=1`, `page`, `limit` |
| `GET /api/epg` | Guia "Agora/A seguir" de um stream. Query: `stream=<channel@feed>`. Best-effort; `{ available: false }` quando não há guia |
| `POST /api/reload` | Recarrega os dados da API pública sem reiniciar o servidor. Protegido: exige `RELOAD_TOKEN` (env) e o header `x-reload-token`; sem o token definido o endpoint responde `403` |
| `GET /stream?url=…&ref=…&ua=…` | Proxy do stream (uso interno do player) |

## Segurança

- **Sem segredos no front-end.** O site não usa nenhum token. A origem dos dados
  é configurável por variável de ambiente, lida apenas no back-end.
- **Anti-XSS.** Todo dado da API entra no DOM via `textContent`/atributos — nunca
  `innerHTML` com dado cru (ver `public/js/dom.js`).
- **Validação de URL.** Logos e streams só são aceitos com protocolo `http`/`https`;
  esquemas como `javascript:` ou `data:` são rejeitados.
- **Proxy com allowlist + anti-SSRF.** O proxy só acessa hosts presentes no
  dataset (mais hosts referenciados por playlists já confiáveis, com teto de
  crescimento) e bloqueia destinos internos/privados/especiais: `localhost`,
  `127.0.0.0/8`, `10/8`, `192.168/16`, `172.16/12`, `169.254/16`, CGNAT
  `100.64/10`, TEST-NET, multicast/reservados, e **IPv6** (loopback `::1`,
  IPv4-mapeado `::ffff:…` (com e sem pontos), ULA, link-local `fe80::/10`) —
  inclusive quando o hostname chega entre colchetes ou com ponto final
  (`localhost.`). Cada salto de **redirect** é revalidado e o **DNS é resolvido**
  para barrar domínios que apontem a IP privado (mitiga *DNS rebinding*),
  impedindo SSRF via `Location` ou rebind.
- **Endpoint de reload protegido.** `POST /api/reload` exige `RELOAD_TOKEN`.
- **Timeout de rede.** As buscas à API pública têm timeout, evitando travamento.

## Limitações conhecidas

- Streams **geo-bloqueados**, offline ou que exijam DRM não tocam (esperado).
- Streams **MPEG-TS brutos** (não-HLS) podem não tocar em todos os navegadores.
- O EPG (programação) existe no projeto apenas como *fontes externas* de XMLTV;
  integrá-lo é um próximo passo natural (não incluído nesta versão).
