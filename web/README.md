# IPTV Web

Site que consome os dados **públicos** do projeto [iptv-org](https://github.com/iptv-org/iptv)
e os apresenta como uma plataforma de IPTV: catálogo de canais com logos, busca,
filtros (categoria, país, idioma) e player HLS no navegador.

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
│   └── proxy.js       Proxy de streams (CORS, mixed-content, headers, anti-SSRF)
└── public/            Front-end estático (vanilla JS + hls.js)
    ├── index.html
    ├── css/styles.css
    └── js/{app,ui,player,api,dom}.js
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

Pré-requisitos: **Node.js 18+** (testado no Node 22).

```sh
cd web
npm install      # instala o express
npm run dev      # modo desenvolvimento (reinicia ao salvar)
# ou
npm start        # modo produção
```

Acesse **http://localhost:3000**.

Para mudar a porta: `PORT=8080 npm start`.

## API interna (back-end)

| Rota | Descrição |
| --- | --- |
| `GET /api/meta` | Total + categorias, países e idiomas (com contagem) para os filtros |
| `GET /api/channels` | Lista filtrada/paginada. Query: `search`, `category`, `country`, `language`, `nsfw=1`, `page`, `limit` |
| `POST /api/reload` | Recarrega os dados da API pública sem reiniciar o servidor |
| `GET /stream?url=…&ref=…&ua=…` | Proxy do stream (uso interno do player) |

## Segurança

- **Sem segredos no front-end.** O site não usa nenhum token. A origem dos dados
  é configurável por variável de ambiente, lida apenas no back-end.
- **Anti-XSS.** Todo dado da API entra no DOM via `textContent`/atributos — nunca
  `innerHTML` com dado cru (ver `public/js/dom.js`).
- **Validação de URL.** Logos e streams só são aceitos com protocolo `http`/`https`;
  esquemas como `javascript:` ou `data:` são rejeitados.
- **Proxy com allowlist + anti-SSRF.** O proxy só acessa hosts presentes no
  dataset (mais hosts referenciados por playlists já confiáveis) e bloqueia
  destinos internos/privados (`localhost`, `127.0.0.0/8`, `10/8`, `192.168/16`,
  `172.16/12`, `169.254/16`, IPv6 loopback/ULA), evitando virar um proxy aberto.

## Limitações conhecidas

- Streams **geo-bloqueados**, offline ou que exijam DRM não tocam (esperado).
- Streams **MPEG-TS brutos** (não-HLS) podem não tocar em todos os navegadores.
- O EPG (programação) existe no projeto apenas como *fontes externas* de XMLTV;
  integrá-lo é um próximo passo natural (não incluído nesta versão).
