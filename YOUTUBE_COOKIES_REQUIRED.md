# ⚠️ SOLUÇÃO: YouTube Cookies são OBRIGATÓRIOS

## O Problema
O YouTube bloqueou scraping de servidores cloud. O erro `"Sign in to confirm you're not a bot"` é permanente sem autenticação.

## A Solução: Usar Cookies do Seu Navegador

### Passo 1: Exportar Cookies (5 minutos)

**Opção A: Chrome (RECOMENDADO)**

1. Abra Chrome e vá para: [youtube.com](https://youtube.com)
2. Faça login na sua conta do Google
3. Instale a extensão: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndaipenyoaomcurk7calniemjkl)
4. Clique no ícone da extensão
5. Clique em **Export** e salve o arquivo como `cookies.txt`

**Opção B: Firefox**

```bash
# Instale a extensão Cookies.txt
# https://addons.mozilla.org/firefox/addon/cookies-txt/

# Ou use com yt-dlp
yt-dlp --cookies-from-browser firefox \
  --username seu_email@gmail.com \
  https://www.youtube.com/watch?v=g3op203ZFNQ
```

### Passo 2: Adicionar o Arquivo ao Projeto

```bash
# Copiar o arquivo de cookies para o projeto
cp ~/Downloads/cookies.txt BackEnd/config/cookies.txt
```

### Passo 3: Configurar no Railway

1. Vá ao painel do **Railway**
2. Clique em **Deploy → Variables**
3. Adicione:
   ```
   YOUTUBE_COOKIES_FILE=/app/config/cookies.txt
   ```

4. Vá para **Plugins → File Storage** (ou similar)
5. Faça upload do `cookies.txt`

### Passo 4: Redeploy

```bash
# Commit e push (SEM o arquivo sensível)
git push
```

Railway fará pull, verá `YOUTUBE_COOKIES_FILE` setado e usará os cookies automaticamente!

## Verificação

Para testar se está funcionando:

```bash
# No seu servidor (via SSH Railway ou CLI)
yt-dlp --cookies /app/config/cookies.txt \
  "https://www.youtube.com/watch?v=QUALQUER_VIDEO_AQUI"
```

Se funcionar, o app também funcionará!

## ❌ Por Que Isso Acontece

- YouTube detecta padrões de requisições de servidores cloud
- IP de data center = bloqueio automático
- Cookies do navegador real = confiança

## Alternativas (se cookies não funcionar)

### 1. Usar Proxy Residencial
```bash
# Bright Data, ScraperAPI, ou similar
# Custa ~$5-50/mês mas funciona garantido
```

### 2. YouTube Data API
```bash
# API oficial do Google
# Limitado a 10,000 quotas/dia
# Recomendado para produção legítima
```

### 3. Esperar YouTube mudar de novo
- YouTube muda defesa a cada atualização
- yt-dlp é atualizado constantemente
- Pode voltar a funcionar em 1-2 semanas

## ⚠️ SEGURANÇA

Cookies contêm sua sessão autenticada. **NUNCA faça commit do arquivo**:

```bash
# Já está no .gitignore?
cat .gitignore | grep cookies

# Se não estiver, adicione:
echo "BackEnd/config/cookies.txt" >> .gitignore
```

## Debug

Se ainda não funcionar:

1. **Cookies expirados?**
   ```bash
   # Exporte novamente do navegador
   ```

2. **Arquivo corrompido?**
   ```bash
   # Verifique o formato
   head -5 BackEnd/config/cookies.txt
   # Deve ter linhas começando com # e .youtube.com
   ```

3. **Caminhos incorretos?**
   ```bash
   # Confirme a variável
   echo $YOUTUBE_COOKIES_FILE
   # Deve ser: /app/config/cookies.txt
   ```

4. **Vê logs do container?**
   ```bash
   # No Railway: Deployment → Logs
   # Procure por: "[INFO] Cookies carregados"
   ```

## Próxima Etapa

Uma vez que funcione com cookies, o app deve baixar vídeos normalmente! 🎉

Qualquer dúvida, veja: [yt-dlp Cookies FAQ](https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp)
