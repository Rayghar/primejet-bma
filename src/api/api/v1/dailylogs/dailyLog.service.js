// =======================================================================
// src/api/v1/dailylogs/dailyLog.service.js (NEW FILE)
// =======================================================================
const DailyLog = require('../../../models/dailyLog.model');
const HttpError = require('../../../utils/HttpError');

const createLog = async (logData, user) => {
    const log = new DailyLog({
        ...logData,
        submittedBy: { uid: user.id, email: user.email },
    });
    await log.save();
    return log.toObject();
};

const getPendingLogs = async () => {
    const logs = await DailyLog.find({ status: 'pending' }).sort({ createdAt: -1 });
    return logs.map(log => log.toObject());
};

const updateStatus = async (logId, status, user) => {
    const log = await DailyLog.findOne({ id: logId });
    if (!log) {
        throw new HttpError(404, 'Log entry not found.');
    }
    if (log.status !== 'pending') {
        throw new HttpError(400, `This log has already been ${log.status}.`);
    }
    log.status = status;
    log.reviewedBy = { uid: user.id, email: user.email };
    log.reviewedAt = new Date();
    await log.save();
    return log.toObject();
};

module.exports = { createLog, getPendingLogs, updateStatus };