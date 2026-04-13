const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED',
      });
    },
  });

/**
 * Rate limiter para login — máximo 5 tentativas a cada 15 minutos
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true, // Retorna info de rate limit em `RateLimit-*` headers
  legacyHeaders: false, // Desativa `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Rate limiter para registro — máximo 5 registros a cada 15 minutos
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 registros
  message: 'Muitas tentativas de registro. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de registro. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

// Sensitive account actions
const deleteAccountLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  'Muitas tentativas de exclusao de conta. Tente novamente em 15 minutos.'
);

const undeleteAccountLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  'Muitas tentativas de recuperacao de conta. Tente novamente em 15 minutos.'
);

// Public GDPR token confirmation endpoint
const gdprTokenLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Muitas tentativas com token de acesso. Tente novamente em 15 minutos.'
);

// Authenticated GDPR data export endpoints
const gdprAccessLimiter = createLimiter(
  60 * 60 * 1000,
  10,
  'Muitas solicitacoes de exportacao de dados. Tente novamente em 1 hora.'
);

// Public DMCA endpoint to reduce abuse/spam
const dmcaLimiter = createLimiter(
  60 * 60 * 1000,
  10,
  'Muitas notificacoes DMCA enviadas. Tente novamente em 1 hora.'
);

// Heavy/expensive operations
const exportJobLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Muitas exportacoes solicitadas. Tente novamente em 15 minutos.'
);

const statsLimiter = createLimiter(
  5 * 60 * 1000,
  120,
  'Muitas consultas de estatisticas. Tente novamente em alguns minutos.'
);

module.exports = {
  loginLimiter,
  registerLimiter,
  deleteAccountLimiter,
  undeleteAccountLimiter,
  gdprTokenLimiter,
  gdprAccessLimiter,
  dmcaLimiter,
  exportJobLimiter,
  statsLimiter,
};
