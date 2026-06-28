// workers/index.js
const orderWorker = require('./order.worker')
const zohoWorker = require('./zoho.worker');
const emailWorker = require('./email.worker');
const logger = require('../utils/logger');

logger.info('All workers initialized');

module.exports = {
    orderWorker,
    zohoWorker,
    emailWorker,
};