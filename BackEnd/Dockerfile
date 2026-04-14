FROM node:20-alpine

# Instalar dependências do sistema necessárias para processamento de vídeo
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    unzip

# Criar virtual environment e instalar yt-dlp
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir yt-dlp

# Instalar Deno (necessário para YouTube extraction via JavaScript)
RUN curl -fsSL https://deno.land/x/install/install.sh | sh
ENV PATH="/root/.deno/bin:$PATH"

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
