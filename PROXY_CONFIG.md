# Configuração de Proxy para YouTube

## Problema
Alguns vídeos YouTube estão com **restrição geográfica** (ex: apenas disponíveis no Brasil).

## Solução
Configure uma variável de ambiente `YOUTUBE_PROXY` com um proxy ou VPN que esteja no país-alvo.

## Como Usar

### 1. Opção A: Usar um Proxy SOCKS5 Gratuito

**Localize um proxy SOCKS5** que esteja no Brasil:
- Site: https://www.sslproxies.org/ (filtrar por Brazil, SOCKS5)
- Ou: https://free-proxy-list.net/

Exemplo de proxy: `socks5://187.94.211.99:1080`

### 2. Opção B: Usar VPN Local + Tunnel

Se tiver VPN instalada localmente:
```bash
# Criar tunnel local na porta 1080
ssh -D 1080 user@vpn-server

# Depois configurar:
export YOUTUBE_PROXY=socks5://127.0.0.1:1080
```

### 3. Ativar no seu Backend

#### Em `.env`:
```env
YOUTUBE_PROXY=socks5://SEU_PROXY_AQUI:PORTA
```

#### Ou via linha de comando:
```bash
export YOUTUBE_PROXY=socks5://187.94.211.99:1080
npm start
```

#### Ou via Docker:
```bash
docker run -e YOUTUBE_PROXY=socks5://187.94.211.99:1080 your-app
```

## Formatos Suportados

O yt-dlp aceita:
- `http://user:pass@proxy:port`
- `https://proxy:port`
- `socks4://proxy:port`
- `socks5://proxy:port`
- `socks5h://proxy:port` (DNS no proxy)

## ⚠️ Avisos

1. **Proxies gratuitos são lentos** - Downloads podem levar mais tempo
2. **Segurança** - Use apenas proxies de confiança; evite credenciais pessoais
3. **Legal** - Respeite os ToS do YouTube e leis locais

## Teste

```bash
# Testar sem proxy (falhará se vídeo é restrito)
yt-dlp https://youtu.be/cDjCnuxAtQ8

# Testar com proxy
yt-dlp --proxy socks5://187.94.211.99:1080 https://youtu.be/cDjCnuxAtQ8
```

## Alternativa: Usar Outro Vídeo

Se não quiser configurar proxy, simplesmente use vídeos **sem restrição geográfica**.
