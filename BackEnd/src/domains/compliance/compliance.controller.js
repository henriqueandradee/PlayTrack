const DmcaNotice = require('../../models/DmcaNotice');
const FraudAlert = require('../../models/FraudAlert');
const { success, error } = require('../../shared/response.helper');
const logger = require('../../shared/logger');

/**
 * POST /compliance/dmca-report
 * Marco Civil + prática de notificação de infração de direitos autorais.
 */
exports.createDmcaReport = async (req, res, next) => {
  try {
    const {
      reporterName,
      reporterEmail,
      rightsOwner,
      infringingUrl,
      originalWorkDescription,
      statementGoodFaith,
      statementAccuracy,
      digitalSignature,
    } = req.body;

    if (!statementGoodFaith || !statementAccuracy) {
      return error(res, 'Required legal statements must be accepted', 400, 'DMCA_STATEMENTS_REQUIRED');
    }

    const notice = await DmcaNotice.create({
      reporterName,
      reporterEmail,
      rightsOwner,
      infringingUrl,
      originalWorkDescription,
      statementGoodFaith,
      statementAccuracy,
      digitalSignature,
    });

    logger.info('DMCA notice created', {
      requestId: req.requestId,
      noticeId: String(notice._id),
      reporterEmail,
    });

    return success(
      res,
      {
        noticeId: notice._id,
        status: notice.status,
        message: 'DMCA notice received. Our team will review and respond.',
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /compliance/fraud-alerts
 * Endpoint simples para auditoria de sinais de fraude do usuário.
 */
exports.getMyFraudAlerts = async (req, res, next) => {
  try {
    const alerts = await FraudAlert.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return success(res, { alerts });
  } catch (err) {
    next(err);
  }
};
