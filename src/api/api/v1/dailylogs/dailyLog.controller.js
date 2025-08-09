// =======================================================================
// src/api/v1/dailylogs/dailyLog.controller.js (NEW FILE)
// =======================================================================
const dailyLogService = require('./dailyLog.service');

const createDailyLog = async (req, res, next) => {
    try {
        const log = await dailyLogService.createLog(req.body, req.user);
        res.status(201).json(log);
    } catch (error) {
        next(error);
    }
};

const getPending = async (req, res, next) => {
    try {
        const logs = await dailyLogService.getPendingLogs();
        res.status(200).json(logs);
    } catch (error) {
        next(error);
    }
};

const updateLogStatus = async (req, res, next) => {
    try {
        const { logId } = req.params;
        const { status } = req.body;
        const log = await dailyLogService.updateStatus(logId, status, req.user);
        res.status(200).json(log);
    } catch (error) {
        next(error);
    }
};

module.exports = { createDailyLog, getPending, updateLogStatus };