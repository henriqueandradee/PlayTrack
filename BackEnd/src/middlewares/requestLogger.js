const crypto = require('crypto');
const morgan = require('morgan');
const logger = require('../shared/logger');

const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};

const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms requestId=:req[x-request-id]',
  { stream: morganStream }
);

module.exports = {
  requestId,
  httpLogger,
};
