FROM node:20-alpine

# Instalar apenas dependências essenciais
RUN apk add --no-cache \
    ffmpeg \
    curl

WORKDIR /app

# Copiar package.json
COPY BackEnd/package*.json ./

# Instalar dependências Node
RUN npm ci --only=production

# Copiar código-fonte
COPY BackEnd/src ./src
COPY BackEnd/bin ./bin
COPY BackEnd/logs ./logs

# Criar diretório de logs se não existir
RUN mkdir -p ./logs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicação
CMD ["npm", "start"]
