# ✨ Como Usar - YouTube Cookies (MUITO MAIS FÁCIL!)

## O Problema Resolvido

Antes: pedir ao usuário pra exportar cookies manualmente = experiência ruim.

**Agora**: 2 formas super simples:

---

## Opção 1: Upload via API (SEM INSTALAÇÕES! ⭐ RECOMENDADO)

Tem uma extensão/script que pode fazer isso automaticamente. Vaja a seção "Automation" abaixo.

---

## Opção 2: Fazer Upload Manual (5 minutos)

### Passo 1: Exporte os cookies do seu navegador

**Chrome/Edge:**
1. Instale: [Get cookies.txt LOCALLY](https://c hrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndaipenyoaomcurk7calniemjkl)
2. Vá ao YouTube.com
3. Clique no ícone da extensão
4. Clique "Export" → salve `cookies.txt`

**Firefox:**
1. Instale: [cookies.txt](https://addons.mozilla.org/firefox/addon/cookies-txt/)
2. Clique no ícone da extensão
3. Salve `cookies.txt`

**Command Line (qualquer navegador):**
```bash
yt-dlp --cookies-from-browser chrome --write-cookies cookies.txt https://www.youtube.com
```

### Passo 2: Faça upload do arquivo

```bash
curl -X POST \
  -F "cookies=@cookies.txt" \
  https://seu-servidor.app/youtube/upload-cookies
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Cookies do YouTube foram salvos com sucesso!"
}
```

### Passo 3: Pronto! 

Próximos downloads de YouTube vão usar os cookies automaticamente.

---

## Automation: Script Python para fazer tudo automaticamente

Se você quiser, pode criar um script que faz tudo isso:

```python
#!/usr/bin/env python3
import subprocess
import requests
import os

# 1. Exportar cookies
subprocess.run([
    'yt-dlp',
    '--cookies-from-browser', 'chrome',
    '--write-cookies', 'cookies.txt',
    'https://www.youtube.com'
])

# 2. Fazer upload
with open('cookies.txt', 'rb') as f:
    files = {'cookies': f}
    response = requests.post(
        'https://seu-servidor.app/youtube/upload-cookies',
        files=files
    )
    print(response.json())

# 3. Limpar arquivo local
os.remove('cookies.txt')
```

---

## Verificar Status

```bash
curl https://seu-servidor.app/youtube/cookies-status
```

Resposta:
```json
{
  "status": "configured",
  "message": "YouTube está autenticado. Downloads devem funcionar.",
  "hasLocalCookies": true
}
```

---

## Remover Cookies (se precisar)

```bash
curl -X DELETE https://seu-servidor.app/youtube/cookies
```

---

## Endpoints Disponíveis

| Método | Endpoint | O que faz |
|--------|----------|----------|
| `POST` | `/youtube/upload-cookies` | Fazer upload de cookies.txt |
| `GET` | `/youtube/cookies-status` | Ver se está autenticado |
| `DELETE` | `/youtube/cookies` | Remover arquivo de cookies |

---

## E se ainda não funcionar?

YouTube muda suas defesas frequentemente. Se ainda der erro:

1. **Exporte cookies novamente** (cookies expiram)
2. **Tente em 1-2 horas** (YouTube bloqueia temporariamente)
3. **Use outro navegador** (Chrome funciona melhor que Firefox)
4. **Entre em contato com suporte**

---

## ⚠️ Segurança

- Cookies contêm sua sessão autenticada
- Não compartilhe arquivo `cookies.txt` com terceiros
- Mude sua senha do Google se achar suspeito
- Arquivo é deletado se usar `DELETE /youtube/cookies`

---

## Como funciona

1. Você faz upload do `cookies.txt`
2. Servidor salva em `/app/config/cookies.txt`
3. Próximo download usa `yt-dlp --cookies /app/config/cookies.txt`
4. YouTube reconhece como navegador real → não bloqueia 🎉

Simples assim!
