# YouTube Cookies Configuration

## Problema
O YouTube bloqueia requisições de domínios de servidor cloud com mensagem "Sign in to confirm you're not a bot".

## Solução: Usar Cookies do YouTube

### Passo 1: Exportar Cookies (Fazer uma vez na sua máquina local)

#### Opção A: Usar extensão Chrome (Recomendado)
1. Instale a extensão [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndaipenyoaomcurk7calniemjkl)
2. Acesse https://www.youtube.com e faça login
3. Clique na extensão
4. Clique em "Export" para baixar `cookies.txt`

#### Opção B: Usar yt-dlp diretamente
```bash
yt-dlp --cookies-from-browser chrome --write-cookies cookies.txt https://www.youtube.com/watch?v=g3op203ZFNQ
```

### Passo 2: Fazer Upload do Arquivo

Coloque o `cookies.txt` no servidor Railway:

```bash
# Copiar para sua estrutura do projeto
cp cookies.txt BackEnd/config/cookies.txt
git add BackEnd/config/cookies.txt
git commit -m "chore: add youtube cookies for authentication"
git push
```

### Passo 3: Configurar Variável de Ambiente

No painel do Railway, vá em **Variables** e adicione:

```
YOUTUBE_COOKIES_FILE=/app/config/cookies.txt
```

### Formato do Arquivo cookies.txt

O arquivo deve estar em formato **Netscape** (padrão do navegador):

```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	1735689600	CONSENT	YES+
.youtube.com	TRUE	/	TRUE	1735689600	__Secure-3PSID	...
...
```

## Alternativas se Cookies não funcionar

### 1. Aumentar Timeouts
Se o arquivo estiver grande ou houver latência, ajuste em `.env`:
```
EXPORT_YTDLP_TIMEOUT_MS=1200000  # 20 minutos
```

### 2. Usar Proxy Residencial
Se o YouTube continuar bloqueando, use um serviço como:
- Bright Data (brightdata.com)
- ScraperAPI (scraperapi.com)
- Oxylabs (oxylabs.io)

Exemplo com ScraperAPI:
```bash
yt-dlp --proxy "socks5://proxy.scraperapi.com:7000"
```

### 3. API do YouTube (Alternativa)
Para casos legítimos, considere usar a [YouTube Data API v3](https://developers.google.com/youtube/v3) ao invés de web scraping.

## Segurança

⚠️ **Importante**: Os cookies contêm credenciais de autenticação. 

**Não commite com dados sensíveis!** Use:
```bash
git add BackEnd/config/cookies.txt
git update-index --skip-worktree BackEnd/config/cookies.txt
```

Ou configure no `.gitignore`:
```
BackEnd/config/cookies.txt
```

E use variáveis de ambiente do Railway para o caminho real.

## Debug

Para testar manualmente:
```bash
yt-dlp --cookies BackEnd/config/cookies.txt "https://www.youtube.com/watch?v=g3op203ZFNQ"
```

Se ainda falhar, veja logs detalhados:
```bash
yt-dlp -v --cookies BackEnd/config/cookies.txt "https://www.youtube.com/watch?v=g3op203ZFNQ"
```
