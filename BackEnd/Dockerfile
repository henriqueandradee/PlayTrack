FROM node:20-alpine

# Instalar dependências do sistema necessárias para processamento de vídeo
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates

# Instalar yt-dlp
RUN pip install --no-cache-dir yt-dlp

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências Node.js
RUN npm ci --only=production

# Copiar código-fonte
COPY src ./src
COPY bin ./bin

# Criar diretório de logs
RUN mkdir -p ./logs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Iniciar aplicação
CMD ["npm", "start"]
