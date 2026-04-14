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
    sameSite: isProduction ? 'none' : 'strict', // ✅ 'none' em produção para cross-site; 'strict' em dev
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias (corresponde a JWT_EXPIRES_IN)
    path: '/', // Cookie disponível em todas as rotas
    domain: isProduction ? undefined : 'localhost', // Cookie válido para todos os subdomínios em produção
  });
};

/**
 * Limpa cookie de token
 */
const clearTokenCookie = (res) => {
  const isProduction = config.env === 'production';
  
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    path: '/',
    domain: isProduction ? undefined : 'localhost',
  });
};

module.exports = { setTokenCookie, clearTokenCookie };
