# Imagem de produção do IPTV Web (Node + Express).
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Instala só as dependências de produção (usa o lockfile para builds reprodutíveis).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Código da aplicação.
COPY . .

# Roda como usuário sem privilégios.
USER node

EXPOSE 3000

# Healthcheck bate no endpoint /healthz (fetch é global no Node 22).
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
