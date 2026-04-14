FROM node:20-alpine

# Instalar dependências do sistema necessárias para processamento de vídeo
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    unzip \
    libffi-dev \
    openssl-dev \
    gcc \
    musl-dev

# Instalar yt-dlp diretamente com pip
RUN pip install --no-cache-dir --break-system-packages yt-dlp

# Garantir que Node.js está no PATH
RUN ln -sf /usr/local/bin/node /usr/bin/node || true

# Verificar instalação
RUN yt-dlp --version && node --version

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências Node.js
RUN npm ci --only=production

# Copiar código-fonte
COPY src ./src
COPY bin ./bin
COPY config ./config

# Criar diretório de config do yt-dlp
RUN mkdir -p /root/.config/yt-dlp
COPY config/yt-dlp.conf /root/.config/yt-dlp/yt-dlp.conf

# Criar diretório de logs
RUN mkdir -p ./logs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Iniciar aplicação
CMD ["npm", "start"]
