const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const config = require('./config');
const { requestId, httpLogger } = require('./middlewares/requestLogger');
const { inputSanitizer } = require('./middlewares/inputSanitizer');
const { csrfGuard } = require('./middlewares/csrfGuard');

const { notFound, errorHandler } = require('./middlewares/errorHandler');

// Domain routes
const authRoutes         = require('./domains/auth/auth.routes');
const videoRoutes         = require('./domains/videos/video.routes');
const analysisRoutes      = require('./domains/analysis/analysis.routes');
const statsRoutes         = require('./domains/stats/stats.routes');
const subscriptionRoutes  = require('./domains/subscriptions/subscription.routes');
const gdprRoutes         = require('./domains/gdpr/gdpr.routes');
const complianceRoutes    = require('./domains/compliance/compliance.routes');
const sharingRoutes      = require('./domains/sharing/sharing.routes');

const app = express();

// ---- Trust Proxy ----
// Necessário para Railway, Vercel, Heroku e outros reverse proxies
// Permite que express-rate-limit identifique corretamente o IP do usuário via X-Forwarded-For
app.set('trust proxy', 1);

// ---- Security Headers ----
app.use(helmet());
app.use(requestId);

// ---- CORS ----
// Em desenvolvimento, permite localhost. Em produção, usa domínios específicos da variável de ambiente
const allowedOrigins = config.cors.origin === '*'
  ? (config.env === 'development'
      ? ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5173'] // Vite, etc.
      : []) // Produção NÃO deve usar wildcard com credentials
  : config.cors.origin.split(',').map((o) => o.trim());

// ⚠️ Aviso em produção se CORS está aberto
if (config.env === 'production' && (config.cors.origin === '*' || allowedOrigins.length === 0)) {
  console.warn(
    '\n⚠️  AVISO DE SEGURANÇA: CORS está configurado como "*" em PRODUÇÃO!\n' +
    'Isso abre a API para chamadas de qualquer origem.\n' +
    'Configure CORS_ORIGIN no .env com domínios específicos, ex: https://seusite.com,https://api.seusite.com\n'
  );
}

app.use(
  cors({
    origin: (origin, cb) => {
      // Se não houver origem (requisições locais), permite
      if (!origin) return cb(null, true);
      
      // Verifica se origin está na lista permitida
      if (allowedOrigins.includes(origin)) return cb(null, true);
      
      // Bloqueia se não está permitido
      cb(new Error(`CORS origem não permitida: ${origin}`));
    },
    credentials: true, // Permite envio de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---- Body parsing ----
// Limita tamanho do request para prevenir "buffer overflow attacks"
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ---- Cookie parsing ----
app.use(cookieParser());

// ---- Input sanitization (NoSQL operator injection hardening) ----
app.use(inputSanitizer);

// ---- CSRF protection for cookie-authenticated mutating requests ----
app.use(csrfGuard);

// ---- Logging ----
if (config.env !== 'test') {
  app.use(httpLogger);
}

// ---- Health check ----
app.get('/', (req, res) =>
  res.status(200).json({ status: 'ok', message: 'PlayTrack API v2 is running' })
);

app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok' })
);

// ---- API Routes (v2 domain structure) ----
app.use('/auth',          authRoutes);
app.use('/videos',        videoRoutes);
app.use('/analysis',      analysisRoutes);
app.use('/stats',         statsRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/sharing',       sharingRoutes);

// ✅ LGPD Compliance Routes (Art. 17, 18, 20)
app.use('/gdpr',          gdprRoutes);
app.use('/compliance',    complianceRoutes);

// ---- Error handling ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
