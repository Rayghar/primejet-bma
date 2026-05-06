import React, { useEffect, useMemo, useState } from 'react';
import { getUsers, inviteUser, updateUser, updateUserRole, deleteUser } from '../../api/userService';
import { getPlants } from '../../api/operationsService';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { ROLE_OPTIONS, BRANCH_SCOPE_OPTIONS, permissionsForRole, getEffectivePermissions, getRoleLabel } from '../../config/accessControl';
import { Eye, RefreshCw, Save, Shield, Trash2, UserPlus } from 'lucide-react';
import { normalizeBranchOptions, getBranchValue as getScopedBranchValue, getBranchLabel } from '../../utils/branchAccess';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'cashier',
  password: 'Temporary1!',
  branchScope: 'all',
  allowedBranches: [],
  allowedBranchesText: '',
  permissionsText: '',
  removePermissionsText: '',
  status: 'active',
  mustChangePassword: true,
  accessNotes: '',
};

const getBranchValue = (branch = {}) => String(
  branch.branchId || branch.id || branch._id || branch.branchCode || branch.branchKey || branch.code || branch.key || branch.name || ''
).trim();

const normalizeBranch = (branch) => {
  if (!branch) return null;
  if (typeof branch === 'string') {
    const value = branch.trim();
    return value ? { branchId: value, branchCode: value, branchKey: value, branchName: value, optionValue: value } : null;
  }

  const branchId = String(branch.branchId || branch.id || branch._id || branch.branchCode || branch.branchKey || '').trim();
  const branchCode = String(branch.branchCode || branch.code || branch.branchKey || branch.key || branchId || '').trim();
  const branchKey = String(branch.branchKey || branch.key || branchCode || branchId || '').trim();
  const branchName = String(branch.branchName || branch.name || branch.label || branchCode || branchId || '').trim();
  const optionValue = branchId || branchCode || branchKey || branchName;

  if (!optionValue) return null;
  return {
    branchId: branchId || optionValue,
    branchCode: branchCode || optionValue,
    branchKey: branchKey || branchCode || optionValue,
    branchName: branchName || branchCode || optionValue,
    optionValue,
  };
};

const normalizeBranches = (branches = []) => {
  const seen = new Set();
  return (Array.isArray(branches) ? branches : [])
    .map(normalizeBranch)
    .filter(Boolean)
    .filter((branch) => {
      const key = getBranchValue(branch);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const parseBranches = (value = '') => normalizeBranches(
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);

const parseCsv = (value = '') => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const branchesToText = (branches = []) => normalizeBranches(branches)
  .map((branch) => branch.branchName || branch.branchCode || branch.branchId || branch.branchKey || '')
  .filter(Boolean)
  .join(', ');

const buildPayload = (form, isEditing = false) => {
  const selectedBranches = normalizeBranches(form.allowedBranches);
  const fallbackBranches = parseBranches(form.allowedBranchesText);
  const trimmedPassword = typeof form.password === 'string' ? form.password.trim() : '';

  const payload = {
    name: form.name,
    email: form.email,
    phone: form.phone,
    role: form.role,
    branchScope: form.branchScope,
    allowedBranches: form.branchScope === 'selected' ? (selectedBranches.length ? selectedBranches : fallbackBranches) : [],
    permissions: parseCsv(form.permissionsText),
    permissionOverrides: {
      add: parseCsv(form.permissionsText),
      remove: parseCsv(form.removePermissionsText),
    },
    status: form.status,
    mustChangePassword: Boolean(form.mustChangePassword),
    accessNotes: form.accessNotes,
  };

  // Critical safety rule:
  // - Create mode may use a default temporary password if the admin leaves the field blank.
  // - Edit mode must NEVER inject a default password, otherwise merely changing role/branch
  //   silently resets the user's real password and causes 401 login failures.
  if (!isEditing) {
    payload.password = trimmedPassword || 'Temporary1!';
  } else if (trimmedPassword) {
    payload.password = trimmedPassword;
  }

  return payload;
};

const effectivePermissionPreview = (form) => getEffectivePermissions({
  role: form.role,
  permissions: parseCsv(form.permissionsText),
  permissionOverrides: {
    add: parseCsv(form.permissionsText),
    remove: parseCsv(form.removePermissionsText),
  },
});

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    setBranchLoading(true);
    setBranchLoadError('');
    try {
      // Source of truth for Staff Access branch assignment is the same Operations
      // branch/plant list used by POS, Close Workspace, finance filters and dashboards.
      // We intentionally do NOT load service zones here because assigning a cashier to
      // a service zone can leave POS/Close Workspace unable to find the actual plant.
      const rows = await getPlants();
      const normalized = normalizeBranchOptions(rows);
      setAvailableBranches(normalized);
      if (!normalized.length) {
        setBranchLoadError('No Operations branches/plants were returned. Load branch/plant records first before assigning cashier or investor access.');
      }
    } catch (err) {
      setAvailableBranches([]);
      setBranchLoadError(
        err?.response?.data?.message || err?.response?.data?.error || err?.message ||
        'Unable to load Operations branches/plants. Confirm your admin user can access Operations → Plant records.'
      );
    } finally {
      setBranchLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
    if (!availableBranches.length) fetchBranches();
  };

  const openEdit = (user) => {
    const assignedBranches = normalizeBranches(user.allowedBranches || []);
    setEditingUser(user);
    setForm({
      ...EMPTY_FORM,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'cashier',
      password: '',
      branchScope: user.branchScope || 'all',
      allowedBranches: assignedBranches,
      allowedBranchesText: branchesToText(assignedBranches),
      permissionsText: (user.permissionOverrides?.add || user.permissions || []).join(', '),
      removePermissionsText: (user.permissionOverrides?.remove || []).join(', '),
      status: user.status || (user.isActive ? 'active' : 'inactive'),
      mustChangePassword: Boolean(user.mustChangePassword),
      accessNotes: user.accessNotes || '',
    });
    setShowModal(true);
    if (!availableBranches.length) fetchBranches();
  };

  const roleTemplatePermissions = useMemo(() => permissionsForRole(form.role), [form.role]);
  const previewPermissions = useMemo(() => effectivePermissionPreview(form), [form]);
  const selectedBranchValues = useMemo(() => normalizeBranchOptions(form.allowedBranches).map(getScopedBranchValue), [form.allowedBranches]);

  const handleBranchScopeChange = (branchScope) => {
    setForm({
      ...form,
      branchScope,
      allowedBranches: branchScope === 'selected' ? form.allowedBranches : [],
      allowedBranchesText: branchScope === 'selected' ? form.allowedBranchesText : '',
    });
    if (branchScope === 'selected' && !availableBranches.length && !branchLoading) {
      fetchBranches();
    }
  };

  const handleBranchSelection = (event) => {
    const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
    const selectedBranches = availableBranches.filter((branch) => selectedValues.includes(getScopedBranchValue(branch)));
    setForm({
      ...form,
      allowedBranches: selectedBranches,
      allowedBranchesText: selectedBranches.map(getBranchLabel).join(', '),
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = buildPayload(form, Boolean(editingUser));
      if (editingUser) {
        const updatePayload = { ...payload };
        delete updatePayload.email; // Keep email stable on edit unless handled by a separate email-change process.
        await updateUser(editingUser.id, updatePayload);
      } else {
        await inviteUser(payload);
      }
      setShowModal(false);
      await fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change role to ${getRoleLabel(newRole)}?`)) return;
    try {
      await updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to update role.');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user ${user.name || user.email}? This only removes the user account.`)) return;
    try {
      await deleteUser(user.id);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to delete user.');
    }
  };

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageTitle title="Staff Access" subtitle="Create users, assign roles, branch visibility and effective module access." />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchUsers} icon={RefreshCw}>Refresh</Button>
          <Button onClick={openCreate} icon={UserPlus}>Create User</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="bg-white/5"><p className="text-xs uppercase text-slate-400">Total Users</p><p className="mt-2 text-2xl font-bold text-white">{users.length}</p></Card>
        <Card className="bg-white/5"><p className="text-xs uppercase text-slate-400">Investors</p><p className="mt-2 text-2xl font-bold text-white">{roleCounts.investor || 0}</p></Card>
        <Card className="bg-white/5"><p className="text-xs uppercase text-slate-400">Finance</p><p className="mt-2 text-2xl font-bold text-white">{(roleCounts.finance_lead || 0) + (roleCounts.accountant || 0)}</p></Card>
        <Card className="bg-white/5"><p className="text-xs uppercase text-slate-400">Cashiers</p><p className="mt-2 text-2xl font-bold text-white">{roleCounts.cashier || 0}</p></Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-300 uppercase text-xs">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Branch Scope</th>
                <th className="p-4">Status</th>
                <th className="p-4">Effective Access</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No users found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold mr-3">
                        {user.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name || 'Unnamed User'}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role || 'customer'}
                      onChange={(event) => handleQuickRoleChange(user.id, event.target.value)}
                      className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                      {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-medium text-white">{BRANCH_SCOPE_OPTIONS.find((scope) => scope.value === user.branchScope)?.label || user.branchScope || 'All branches'}</p>
                    {user.branchScope === 'selected' && <p className="text-[11px] text-slate-500 max-w-xs truncate">{branchesToText(user.allowedBranches || []) || 'No branches assigned'}</p>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${user.status === 'active' || user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.status || (user.isActive ? 'active' : 'inactive')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Shield size={14} />
                      {(user.effectivePermissions || []).includes('*') ? 'Full access' : `${(user.effectivePermissions || []).length} permissions`}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(user)} className="text-blue-300 hover:text-blue-200 p-2" title="Edit access"><Eye size={16} /></button>
                      <button onClick={() => handleDelete(user)} className="text-red-400 hover:text-red-300 p-2" title="Delete user"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <Modal title={editingUser ? 'Edit Staff Access' : 'Create Staff / Investor User'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input required placeholder="Full Name" className="glass-input w-full p-3" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <input required type="email" disabled={Boolean(editingUser)} placeholder="Email Address" className="glass-input w-full p-3 disabled:opacity-50" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <input placeholder="Phone Number" className="glass-input w-full p-3" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <input type="password" placeholder={editingUser ? 'Leave blank to keep password' : 'Temporary Password'} className="glass-input w-full p-3" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Role Template</label>
                <select className="glass-input w-full p-3 bg-slate-800" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <select className="glass-input w-full p-3 bg-slate-800" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Branch / Plant Scope</label>
              <select className="glass-input w-full p-3 bg-slate-800" value={form.branchScope} onChange={(event) => handleBranchScopeChange(event.target.value)}>
                {BRANCH_SCOPE_OPTIONS.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
              </select>
            </div>

            {form.branchScope === 'selected' && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-xs text-gray-400 mb-1">Allowed Branches / Plants</label>
                  <button type="button" onClick={fetchBranches} className="text-[11px] text-blue-300 hover:text-blue-200">
                    {branchLoading ? 'Loading branches...' : 'Refresh branches'}
                  </button>
                </div>

                {availableBranches.length > 0 ? (
                  <>
                    <select
                      multiple
                      size={Math.min(Math.max(availableBranches.length, 3), 8)}
                      className="glass-input w-full p-3 bg-slate-800"
                      value={selectedBranchValues}
                      onChange={handleBranchSelection}
                    >
                      {availableBranches.map((branch) => (
                        <option key={getScopedBranchValue(branch)} value={getScopedBranchValue(branch)}>
                          {getBranchLabel(branch)}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-500">Hold Ctrl/Cmd to select multiple branches. Investors can be assigned one branch, multiple branches, or all branches.</p>
                    <p className="mt-1 text-[11px] text-slate-400">Selected: {normalizeBranchOptions(form.allowedBranches).map(getBranchLabel).join(', ') || 'None selected'}</p>
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                    No Operations branch/plant records are available for selection. Create/load branches in Operations first, then return here and click Refresh branches.
                  </div>
                )}
                {branchLoadError && <p className="mt-1 text-[11px] text-amber-300">{branchLoadError}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Additional Permissions</label>
                <textarea rows="3" placeholder="Optional comma-separated permissions" className="glass-input w-full p-3" value={form.permissionsText} onChange={(event) => setForm({ ...form, permissionsText: event.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Remove Permissions</label>
                <textarea rows="3" placeholder="Optional comma-separated permissions to remove" className="glass-input w-full p-3" value={form.removePermissionsText} onChange={(event) => setForm({ ...form, removePermissionsText: event.target.value })} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.mustChangePassword} onChange={(event) => setForm({ ...form, mustChangePassword: event.target.checked })} />
              Force password change on next login
            </label>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Access Notes</label>
              <textarea rows="2" placeholder="Example: Investor access for Ajah branch only" className="glass-input w-full p-3" value={form.accessNotes} onChange={(event) => setForm({ ...form, accessNotes: event.target.value })} />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><Shield size={16} /> Effective Permission Preview</div>
              <p className="mt-1 text-xs text-slate-400">Role template: {roleTemplatePermissions.includes('*') ? 'Full access' : `${roleTemplatePermissions.length} permissions`} · Effective: {previewPermissions.includes('*') ? 'Full access' : `${previewPermissions.length} permissions`}</p>
              {!previewPermissions.includes('*') && (
                <div className="mt-3 max-h-28 overflow-y-auto text-[11px] text-slate-400">
                  {previewPermissions.slice(0, 40).join(', ')}{previewPermissions.length > 40 ? '...' : ''}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} icon={Save}>{saving ? 'Saving...' : 'Save Access'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
