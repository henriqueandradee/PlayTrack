FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl

# Node.js já está incluído na imagem node:20-alpine
# Verificar e atualizar yt-dlp para suportar YouTube moderno
RUN pip install --no-cache-dir --upgrade yt-dlp

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
