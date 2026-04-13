const config = require('../config');

/**
 * Define cookie de token com segurança
 * - HttpOnly: Não acessível a JavaScript (previne XSS)
 * - Secure: Apenas via HTTPS (em produção)
 * - SameSite: Strict para prevenir CSRF
 */
const setTokenCookie = (res, token) => {
  const isProduction = config.env === 'production';

  res.cookie('token', token, {
    httpOnly: true, // ✅ Crítico: JS não consegue acessar
    secure: isProduction, // ✅ HTTPS obrigatório em produção
    sameSite: 'strict', // ✅ Protege contra CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias (corresponde a JWT_EXPIRES_IN)
    path: '/', // Cookie disponível em todas as rotas
  });
};

/**
 * Limpa cookie de token
 */
const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    path: '/',
  });
};

module.exports = { setTokenCookie, clearTokenCookie };
