/**
 * GDPR / LGPD Controller
 * Implementação dos direitos LGPD:
 * - Direito de Acesso (Art. 18)
 * - Direito de Portabilidade (Art. 20)
 * - Direito ao Esquecimento (Art. 17) [em auth.controller.js]
 */

const crypto = require('crypto');
const User = require('../../models/User');
const Video = require('../../models/Video');
const Event = require('../../models/Event');
const VideoStats = require('../../models/VideoStats');
const GDPRAccessRequest = require('../../models/GDPRAccessRequest');
const logger = require('../../shared/logger');
const { error, notFound } = require('../../shared/response.helper');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const buildAccessExportData = ({ user, videos, events, videoStats, exportMethod }) => ({
  exportDate: new Date().toISOString(),
  dataClass: 'PERSONAL_DATA_EXPORT',
  userId: user._id,
  user: {
    id: user._id,
    username: user.username,
    email: user.email,
    profile: user.profile || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  },
  subscription: {
    type: user.plan?.type || 'free',
    startedAt: user.plan?.startedAt,
    expiresAt: user.plan?.expiresAt,
  },
  videos: videos.map((v) => ({
    id: v._id,
    title: v.title,
    description: v.description,
    source: v.source,
    duration: v.durationSeconds,
    createdAt: v.createdAt,
  })),
  events: events.map((e) => ({
    id: e._id,
    videoId: e.videoId,
    type: e.type,
    timestamp: e.timestamp,
    label: e.label,
    createdAt: e.createdAt,
  })),
  statistics: videoStats.map((s) => ({
    id: s._id,
    videoId: s.videoId,
    stats: s.stats,
    createdAt: s.createdAt,
  })),
  metadata: {
    totalVideos: videos.length,
    totalEvents: events.length,
    exportMethod,
    lastModified: new Date().toISOString(),
  },
});

const sendJsonDownload = (res, fileName, jsonContent) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', Buffer.byteLength(jsonContent));
  return res.send(jsonContent);
};

/**
 * POST /gdpr/access-request
 * Usuário solicita uma cópia de seus dados (LGPD Art. 18)
 * Download direto no app, sem email.
 */
exports.initiateAccessRequest = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return notFound(res, 'Usuário');
    }

    const videos = await Video.find({ userId: user._id, deletedAt: null });
    const events = await Event.find({ userId: user._id, deletedAt: null });
    const videoStats = await VideoStats.find({ userId: user._id, deletedAt: null });

    const exportData = buildAccessExportData({
      user,
      videos,
      events,
      videoStats,
      exportMethod: 'LGPD_ART_18_DIRECT_DOWNLOAD',
    });

    const jsonContent = JSON.stringify(exportData, null, 2);
    const fileName = `playtrack_data_${user._id}_${new Date().toISOString().split('T')[0]}.json`;
    const requestTokenHash = hashToken(crypto.randomBytes(32).toString('hex'));
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Expira solicitações pendentes anteriores desse usuário para reduzir superfície de abuso.
    await GDPRAccessRequest.updateMany(
      {
        userId: req.user._id,
        status: { $in: ['PENDING_CONFIRMATION', 'COMPLETED'] },
      },
      {
        $set: { status: 'EXPIRED' },
        $push: {
          auditTrail: {
            type: 'REQUEST_EXPIRED',
            ip: req.ip || null,
            userAgent: req.headers['user-agent'] || null,
            meta: { reason: 'SUPERSEDED_BY_NEW_REQUEST' },
          },
        },
      }
    );

    const accessRequest = await GDPRAccessRequest.create({
      userId: user._id,
      email: user.email,
      requestTokenHash,
      status: 'COMPLETED',
      expiresAt,
      requestedFromIp: req.ip || null,
      requestedUserAgent: req.headers['user-agent'] || null,
      confirmedAt: new Date(),
      deliveredAt: new Date(),
      auditTrail: [
        {
          type: 'REQUEST_CREATED',
          ip: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
          meta: { requestId: req.requestId || null },
        },
      ],
    });

    logger.info('GDPR access request initiated', {
      requestId: req.requestId,
      userId: String(user._id),
      email: user.email,
      accessRequestId: String(accessRequest._id),
      expiresAt,
    });

    accessRequest.auditTrail.push({
      type: 'DATA_DELIVERED',
      ip: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      meta: {
        requestId: req.requestId || null,
        contentLength: Buffer.byteLength(jsonContent),
      },
    });
    await accessRequest.save();

    logger.info('GDPR access data exported directly', {
      requestId: req.requestId,
      userId: String(user._id),
      accessRequestId: String(accessRequest._id),
      exportMethod: 'LGPD_ART_18_DIRECT_DOWNLOAD',
    });

    return sendJsonDownload(res, fileName, jsonContent);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /gdpr/access-request/confirm
 * Confirma solicitação autenticada e retorna dados do usuário.
 */
exports.confirmAccessRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return error(res, 'Identificador de solicitação inválido', 400, 'INVALID_REQUEST_ID');
    }

    // 1. Validar solicitação e ownership
    const gdprRequest = await GDPRAccessRequest.findOne({
      _id: requestId,
      userId: req.user._id,
    });

    if (!gdprRequest) {
      return error(res, 'Solicitação inválida ou inexistente', 404, 'REQUEST_NOT_FOUND');
    }

    if (gdprRequest.status === 'COMPLETED') {
      return error(res, 'Esta solicitação já foi utilizada', 410, 'REQUEST_ALREADY_USED');
    }

    if (gdprRequest.expiresAt <= new Date()) {
      gdprRequest.status = 'EXPIRED';
      gdprRequest.auditTrail.push({
        type: 'REQUEST_EXPIRED',
        ip: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
        meta: { requestId: req.requestId || null },
      });
      await gdprRequest.save();

      return error(res, 'Solicitação expirada. Solicite novamente.', 410, 'REQUEST_EXPIRED');
    }

    // 2. Buscar usuário da solicitação
    const user = await User.findById(gdprRequest.userId).select('-password');
    if (!user) {
      return notFound(res, 'Usuário');
    }

    gdprRequest.confirmedAt = new Date();
    gdprRequest.auditTrail.push({
      type: 'REQUEST_CONFIRMED',
      ip: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      meta: { requestId: req.requestId || null },
    });
    await gdprRequest.save();

    // 3. Coletar todos os dados do usuário
    const videos = await Video.find({ userId: user._id, deletedAt: null });
    const events = await Event.find({ userId: user._id, deletedAt: null });
    const videoStats = await VideoStats.find({ userId: user._id, deletedAt: null });

    // 4. Montar objeto de exportação
    const exportData = {
      exportDate: new Date().toISOString(),
      dataClass: 'PERSONAL_DATA_EXPORT',
      userId: user._id,

      // Dados pessoais
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile || {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },

      // Plano e subscrição
      subscription: {
        type: user.plan?.type || 'free',
        startedAt: user.plan?.startedAt,
        expiresAt: user.plan?.expiresAt,
      },

      // Vídeos
      videos: videos.map((v) => ({
        id: v._id,
        title: v.title,
        description: v.description,
        source: v.source,
        duration: v.durationSeconds,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),

      // Eventos/Análises
      analysisEvents: events.map((e) => ({
        id: e._id,
        videoId: e.videoId,
        type: e.type,
        category: e.category,
        timestamp: e.timestamp,
        data: e.data,
        createdAt: e.createdAt,
      })),

      // Estatísticas
      statistics: videoStats.map((s) => ({
        id: s._id,
        videoId: s.videoId,
        stats: s.stats,
        createdAt: s.createdAt,
      })),

      // Metadados
      metadata: {
        totalVideos: videos.length,
        totalEvents: events.length,
        exportMethod: 'LGPD_ART_18_AUTHENTICATED_CONFIRMATION',
        lastModified: new Date().toISOString(),
      },
    };

    // 5. Gerar JSON
    const jsonContent = JSON.stringify(exportData, null, 2);

    // 6. Log para auditoria
    logger.info('GDPR access data exported', {
      requestId: req.requestId,
      userId: String(user._id),
      accessRequestId: String(gdprRequest._id),
      exportMethod: 'LGPD_ART_18_AUTHENTICATED_CONFIRMATION',
    });

    // 7. Enviar arquivo
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="playtrack_data_${user._id}_${new Date().toISOString().split('T')[0]}.json"`
    );
    res.setHeader('Content-Length', Buffer.byteLength(jsonContent));

    gdprRequest.deliveredAt = new Date();
    gdprRequest.status = 'COMPLETED';
    gdprRequest.auditTrail.push({
      type: 'DATA_DELIVERED',
      ip: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      meta: {
        requestId: req.requestId || null,
        contentLength: Buffer.byteLength(jsonContent),
      },
    });
    await gdprRequest.save();

    res.send(jsonContent);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /gdpr/portability-request
 * Exportar dados em formato portável (JSON/CSV)
 * LGPD Art. 20 - Direito de Portabilidade
 */
exports.getPortabilityData = async (req, res, next) => {
  try {
    // Mesmo fluxo de coleta de dados, mas com opção de formato
    const { format = 'json' } = req.query; // 'json' ou 'csv'

    const userId = req.user._id;

    // 1. Buscar dados (mesmo fluxo de acesso)
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return notFound(res, 'Usuário');
    }

    const videos = await Video.find({ userId: user._id, deletedAt: null });
    const events = await Event.find({ userId: user._id, deletedAt: null });

    // 2. Montar dados
    const exportData = {
      exportDate: new Date().toISOString(),
      format: format,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      videos: videos.length,
      events: events.length,
    };

    // 3. Enviar conforme formato
    if (format === 'csv') {
      // Converter para CSV (simplificado)
      const csv =
        'id,type,data\n' +
        videos
          .map(
            (v) =>
              `"${v._id}","video","${v.title
                .replace(/"/g, '""')
                .substring(0, 100)}"`
          )
          .join('\n') +
        '\n' +
        events
          .map((e) => `"${e._id}","event","${e.type}"`)
          .join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="playtrack_portability_${userId}_${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send(csv);
    } else {
      // JSON (padrão)
      const jsonContent = JSON.stringify(exportData, null, 2);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="playtrack_portability_${userId}_${new Date().toISOString().split('T')[0]}.json"`
      );
      res.send(jsonContent);
    }

    console.log(`[GDPR] Portability data exported for user ${userId} (format: ${format})`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /gdpr/consents
 * Retorna os consentimentos atuais do usuário autenticado.
 */
exports.getConsentPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('consents updatedAt');
    if (!user) {
      return notFound(res, 'Usuário');
    }

    return res.status(200).json({
      success: true,
      data: {
        consents: user.consents,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /gdpr/consents
 * Atualiza consentimento de marketing (direito de oposição).
 */
exports.updateConsentPreferences = async (req, res, next) => {
  try {
    const { marketingConsent } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return notFound(res, 'Usuário');
    }

    user.consents.marketingConsent = marketingConsent === true;
    user.consents.revokedAt = marketingConsent === true ? null : new Date();
    await user.save();

    logger.info('GDPR consent preferences updated', {
      requestId: req.requestId,
      userId: String(user._id),
      marketingConsent: user.consents.marketingConsent,
    });

    return res.status(200).json({
      success: true,
      data: {
        consents: user.consents,
      },
      message: 'Consentimento atualizado com sucesso.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /gdpr/profile-rectification
 * Permite retificação de dados de perfil editáveis.
 */
exports.rectifyProfileData = async (req, res, next) => {
  try {
    const { displayName, avatarUrl, role } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return notFound(res, 'Usuário');
    }

    if (displayName !== undefined) user.profile.displayName = displayName;
    if (avatarUrl !== undefined) user.profile.avatarUrl = avatarUrl;
    if (role !== undefined) user.profile.role = role;

    await user.save();

    logger.info('GDPR profile rectification executed', {
      requestId: req.requestId,
      userId: String(user._id),
      changedFields: Object.keys(req.body),
    });

    return res.status(200).json({
      success: true,
      data: {
        profile: user.profile,
      },
      message: 'Dados de perfil retificados com sucesso.',
    });
  } catch (err) {
    next(err);
  }
};
