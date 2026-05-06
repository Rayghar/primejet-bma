// src/utils/branchAccess.js
// Shared frontend helper for branch/plant access.  The UI should use the same
// branch definitions used by Operations/POS (Plant records), then filter those
// branches by the logged-in user's branchScope + allowedBranches.

const hasVal = (value) => value !== undefined && value !== null && String(value).trim() !== '';

export const normalizeBranchKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]/g, '');

export const branchAliases = (branch = {}) => {
  if (typeof branch === 'string') return [branch];
  const label = branch.label || '';
  const labelWithoutLocation = String(label).replace(/\s*\([^)]*\)\s*$/, '');
  return [
    branch.id,
    branch._id,
    branch.branchId,
    branch.branchCode,
    branch.branchKey,
    branch.plantId,
    branch.plantCode,
    branch.code,
    branch.key,
    branch.name,
    branch.branchName,
    branch.label,
    labelWithoutLocation,
  ].filter(hasVal).map((x) => String(x).trim());
};

export const normalizeBranchOption = (branch = {}) => {
  if (!branch) return null;
  if (typeof branch === 'string') {
    const value = branch.trim();
    return value ? {
      id: value,
      _id: value,
      name: value,
      branchId: value,
      branchCode: value,
      branchKey: value,
      branchName: value,
      optionValue: value,
    } : null;
  }

  const id = String(branch.id || branch.branchId || branch.branchCode || branch.branchKey || branch.code || branch.key || branch._id || '').trim();
  const mongoId = String(branch._id || branch.mongoId || '').trim();
  const name = String(branch.name || branch.branchName || branch.label || id || mongoId || '').trim();
  const branchCode = String(branch.branchCode || branch.code || branch.branchKey || branch.key || id || mongoId || name).trim();
  const branchKey = String(branch.branchKey || branch.key || branchCode || id || mongoId || name).trim();
  const branchId = String(branch.branchId || id || branchCode || mongoId || name).trim();

  if (!branchId && !name) return null;

  return {
    ...branch,
    id: branchId || id || mongoId || name,
    _id: mongoId || branch._id,
    name: name || branchId || branchCode,
    branchId: branchId || id || mongoId || name,
    branchCode: branchCode || branchId || name,
    branchKey: branchKey || branchCode || branchId || name,
    branchName: branch.branchName || name || branchCode || branchId,
    optionValue: branchId || id || mongoId || branchCode || name,
  };
};

export const normalizeBranchOptions = (branches = []) => {
  const seen = new Set();
  return (Array.isArray(branches) ? branches : [])
    .map(normalizeBranchOption)
    .filter(Boolean)
    .filter((branch) => {
      const aliases = branchAliases(branch).map(normalizeBranchKey).filter(Boolean);
      const key = aliases[0];
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => String(a.name || a.branchName || '').localeCompare(String(b.name || b.branchName || '')));
};

export const getBranchValue = (branch = {}) => normalizeBranchOption(branch)?.id || '';
export const getBranchLabel = (branch = {}) => normalizeBranchOption(branch)?.name || normalizeBranchOption(branch)?.branchName || getBranchValue(branch) || 'Unnamed Branch';

export const getAllowedBranches = (user = {}) => normalizeBranchOptions(user?.allowedBranches || []);

export const isUserBranchRestricted = (user = {}) => {
  const scope = String(user?.branchScope || '').toLowerCase();
  if (scope === 'selected' || scope === 'own' || scope === 'none') return true;
  return false;
};

export const branchMatches = (branch, allowedBranch) => {
  const branchKeys = branchAliases(branch).map(normalizeBranchKey).filter(Boolean);
  const allowedKeys = branchAliases(allowedBranch).map(normalizeBranchKey).filter(Boolean);
  if (!branchKeys.length || !allowedKeys.length) return false;

  return branchKeys.some((branchKey) => allowedKeys.some((allowedKey) => {
    if (branchKey === allowedKey) return true;
    // Tolerant name matching for cases where an admin typed "Festac" manually
    // while the plant is named "Festac Plant" or "Festac Branch".
    if (allowedKey.length >= 4 && branchKey.includes(allowedKey)) return true;
    if (branchKey.length >= 4 && allowedKey.includes(branchKey)) return true;
    return false;
  }));
};

export const filterBranchesForUser = (branches = [], user = {}) => {
  const normalized = normalizeBranchOptions(branches);
  const role = String(user?.role || '').toLowerCase();
  const scope = String(user?.branchScope || 'all').toLowerCase();

  if (!user || ['admin', 'super_admin'].includes(role) || scope === 'all') return normalized;
  if (scope === 'none') return [];

  const allowed = getAllowedBranches(user);
  if (!allowed.length) return [];
  return normalized.filter((branch) => allowed.some((allowedBranch) => branchMatches(branch, allowedBranch)));
};

export const chooseDefaultBranch = (branches = [], user = {}) => {
  const scoped = filterBranchesForUser(branches, user);
  if (!scoped.length) return null;

  const allowed = getAllowedBranches(user);
  if (allowed.length) {
    const explicit = scoped.find((branch) => allowed.some((allowedBranch) => branchMatches(branch, allowedBranch)));
    if (explicit) return explicit;
  }
  return scoped[0];
};

export const branchAccessMessage = (branches = [], user = {}) => {
  if (!isUserBranchRestricted(user)) return '';
  const allowed = getAllowedBranches(user);
  if (!allowed.length) return 'No branch has been assigned to this user. Update Staff Access before the user can operate POS/Close Workspace.';
  if (!filterBranchesForUser(branches, user).length) return 'Assigned branch was not found in the Operations branch/plant list. Confirm Staff Access uses the same branch records as Operations.';
  return '';
};
