FROM node:20-alpine

# Install system dependencies: ffmpeg (via apk) and yt-dlp (via pip3)
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip

RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app

# Install Node dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

EXPOSE 8080

CMD ["npm", "start"]
