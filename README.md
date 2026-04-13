# PlayTrack

PlayTrack é uma plataforma de análise tática e estatística de basquete para atletas e treinadores. Com um player integrado ao YouTube, o usuário assiste à própria partida e registra jogadas, estatísticas e anotações vinculadas ao momento exato do vídeo.

Os vídeos permanecem no YouTube, enquanto o PlayTrack armazena apenas as análises. Isso mantém a solução leve, técnica e escalável.

O modelo de negócio é freemium. O plano gratuito permite analisar 3 jogos. O plano Pro libera vídeos e registros ilimitados, exportação de vídeo com os registros feitos no vídeo e histórico de estatísticas.

O público-alvo são atletas e treinadores semi-profissionais, ou qualquer pessoa que queira estudar o próprio jogo com mais profundidade e organização.

## Estrutura

- `BackEnd/`: API, autenticacao, dominios (videos, GDPR, compliance, assinaturas)
- `FrontEnd/`: aplicacao React (Vite + TypeScript)
- `package.json` (raiz): scripts para subir ambos os apps em paralelo

## Requisitos

- Node.js 20+
- npm 10+

## Instalacao

```bash
npm run install:all
```

## Configuracao de ambiente

Crie os arquivos locais de ambiente a partir dos exemplos:

```bash
cp BackEnd/.env.example BackEnd/.env
cp FrontEnd/.env.example FrontEnd/.env
```

Preencha os valores necessarios em `BackEnd/.env`, especialmente:

- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `API_PUBLIC_URL`
- Integracoes opcionais: `YOUTUBE_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

No frontend, ajuste:

- `VITE_API_URL` em `FrontEnd/.env`

## Executar em desenvolvimento

Rodar backend e frontend juntos:

```bash
npm start
```

Alternativa equivalente:

```bash
npm run dev
```

## Scripts uteis

Raiz:

- `npm start`: sobe backend e frontend em paralelo
- `npm run dev`: alias de desenvolvimento
- `npm run install:all`: instala dependencias de BackEnd e FrontEnd

Backend (`BackEnd/`):

- `npm start`
- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run migrate:v2`

Frontend (`FrontEnd/`):

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run lint`
