// =======================================================================
// src/api/v1/dailylogs/dailyLog.routes.js (NEW FILE)
// =======================================================================
const express = require('express');
const dailyLogController = require('./dailyLog.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { createDailyLogSchema, updateLogStatusSchema } = require('./dailyLog.validation');

const router = express.Router();

router.post(
    '/',
    authMiddleware('cashier'), // Or any role that can submit logs
    validate(createDailyLogSchema),
    dailyLogController.createDailyLog
);

router.get(
    '/pending',
    authMiddleware('manager'), // Only managers/admins can view the queue
    dailyLogController.getPending
);

router.put(
    '/:logId/status',
    authMiddleware('manager'), // Only managers/admins can approve/reject
    validate(updateLogStatusSchema),
    dailyLogController.updateLogStatus
);

module.exports = router;