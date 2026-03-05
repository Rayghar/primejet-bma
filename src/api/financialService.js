// src/api/financialService.js
import apiClient from './apiClient';

/**
 * Financial Service (v2) - GL-first reporting
 *
 * IMPORTANT:
 * - /api/v2/financials/statements should return GL-based statements (audit-grade)
 *
 * Supported usage:
 *  - getFinancialStatements(period, startDate, endDate, branchIdOrZoneId)   (legacy signature)
 *  - getFinancialStatements({ period, startDate, endDate, branchIdOrZoneId }) (new)
 */

// tiny helpers
const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== '';
const safeObj = (v) => (v && typeof v === 'object' ? v : {});
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const buildPeriodParams = (period = 'monthly', startDate, endDate) => {
  const params = { period: period || 'monthly' };
  if (hasVal(startDate) && hasVal(endDate)) {
    params.period = 'custom';
    params.startDate = startDate;
    params.endDate = endDate;
  }
  return params;
};

const buildBranchParams = (branchIdOrZoneId) => {
  if (!hasVal(branchIdOrZoneId)) return {};
  return { branchId: branchIdOrZoneId, serviceZoneId: branchIdOrZoneId };
};

export const getFinancialStatements = async (...args) => {
  let period = 'monthly';
  let startDate;
  let endDate;
  let branchIdOrZoneId;

  // new signature: ({ period, startDate, endDate, branchIdOrZoneId })
  if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    const o = args[0];
    period = o.period || 'monthly';
    startDate = o.startDate;
    endDate = o.endDate;
    branchIdOrZoneId = o.branchIdOrZoneId || o.branchId || o.serviceZoneId;
  } else {
    // legacy signature: (period, startDate, endDate, branchIdOrZoneId)
    [period, startDate, endDate, branchIdOrZoneId] = args;
  }

  const params = {
    ...buildPeriodParams(period, startDate, endDate),
    ...buildBranchParams(branchIdOrZoneId),
  };

  const res = await apiClient.get('/api/v2/financials/statements', { params });

  const payload = safeObj(res.data);

  // Return payload unchanged + safe mirrors
  return {
    ...payload,
    income: safeObj(payload.income),
    balance: safeObj(payload.balance),
    ratios: safeObj(payload.ratios),
    period: safeObj(payload.period),
    branch: safeObj(payload.branch),
    gl: safeObj(payload.gl), // important banner: GL_ONLY / enabled / mode flags if backend returns them
    _normalized: {
      revenueTotal: toNum(payload?.income?.revenue?.total, 0),
      deliveryRecognized: toNum(payload?.income?.revenue?.delivery, 0),
      posRevenue: toNum(payload?.income?.revenue?.pos, 0),
      cogsTotal: toNum(payload?.income?.cogs?.total, 0),
      opexTotal: toNum(payload?.income?.expenses?.total, 0),
      ebitda: toNum(payload?.income?.ebitda, 0),
      netIncome: toNum(payload?.income?.netIncome, 0),
    },
  };
};

export const getRevenueAssuranceReport = async (branchIdOrZoneId) => {
  const res = await apiClient.get('/api/v2/financials/revenue-assurance', {
    params: buildBranchParams(branchIdOrZoneId),
  });
  return res.data;
};

export const getTaxComplianceReport = async (branchIdOrZoneId) => {
  const res = await apiClient.get('/api/v2/financials/tax-compliance', {
    params: buildBranchParams(branchIdOrZoneId),
  });
  return res.data;
};