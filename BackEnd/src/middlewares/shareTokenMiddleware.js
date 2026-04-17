const ShareLink = require('../models/ShareLink');
const { unauthorized } = require('../shared/response.helper');

/**
 * Middleware que permite acesso público com token de compartilhamento
 * Se um token válido for fornecido, permite o acesso sem autenticação
 * Caso contrário, requer autenticação normal
 * 
 * Coloca o videoId no req.shareVideoId para identificar análises públicas
 */
const optionalShareToken = async (req, res, next) => {
  try {
    const token = req.query.shareToken || req.headers['x-share-token'];

    if (token) {
      // Valida o token de compartilhamento
      const shareLink = await ShareLink.findOne({ token });

      if (!shareLink || !shareLink.isValid()) {
        return unauthorized(res, 'Share token expired or invalid');
      }

      // Marca que este é um acesso público compartilhado
      req.shareVideoId = shareLink.videoId.toString();
      req.isPublicShare = true;
      return next();
    }

    // Se não houver token, requer autenticação normal
    const { protect } = require('./authMiddleware');
    protect(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = { optionalShareToken };
