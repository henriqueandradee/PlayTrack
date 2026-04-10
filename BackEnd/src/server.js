const { connectDB } = require('./shared/database');
const config = require('./config');
const app = require('./app');
const { startScheduler } = require('./jobs/cleanupScheduler');

const start = async () => {
  await connectDB();

  // ✅ LGPD Art. 17: Iniciar scheduler para soft-delete automático (30 dias)
  startScheduler();

  // ⚠️ Validação de segurança em produção
  if (config.env === 'production') {
    const corsOrigin = config.cors.origin;
    if (corsOrigin === '*') {
      console.error(
        '\n❌ ERRO CRÍTICO DE SEGURANÇA:\n' +
        'CORS_ORIGIN está configurado como "*" em PRODUÇÃO!\n' +
        'Isso expõe sua API para qualquer origem.\n' +
        'Configure CORS_ORIGIN com domínios específicos no seu .env\n' +
        'Exemplo: CORS_ORIGIN=https://meusiteplaytrack.com,https://api.meusiteplaytrack.com\n'
      );
      process.exit(1);
    }
    console.log('[Security] ✅ CORS configurado com domínios específicos');
    console.log('[Security] ✅ Rate limiting ativo');
    console.log('[Security] ✅ Helmet headers ativo');
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Server] PlayTrack v2 running on port ${config.port} (${config.env})`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n[Server] ${signal} received — shutting down gracefully`);
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
