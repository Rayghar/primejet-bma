// File: src/components/finance/DateBranchBar.js
import React from 'react';
import Badge from '../shared/Badge';
import Button from '../shared/Button';

export default function DateBranchBar({
  businessDate,
  setBusinessDate,
  branchId,
  setBranchId,
  branches = [],
  approvalStatus,
  postingStatus,
  closeStatus,
  actions = [], // [{ label, onClick, variant, disabled, icon }]
}) {
  const reqMissing = !businessDate || !branchId;

  return (
    <div className="sticky top-0 z-40 bg-[#0b1224]/95 backdrop-blur border border-white/10 rounded-2xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Business Date *</div>
            <input
              type="date"
              value={businessDate || ''}
              onChange={(e) => setBusinessDate?.(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white"
            />
          </div>

          <div>
            <div className="text-[11px] text-slate-400 mb-1">Branch *</div>
            <select
              value={branchId || ''}
              onChange={(e) => setBranchId?.(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white"
            >
              <option value="">Select branch…</option>
              {branches.map((b) => (
                <option key={String(b.id)} value={String(b.id)}>
                  {b.name || b.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={approvalStatus === 'APPROVED' ? 'good' : approvalStatus === 'SUBMITTED' ? 'warn' : 'neutral'}>
            Approval: {approvalStatus || 'DRAFT'}
          </Badge>
          <Badge tone={postingStatus === 'POSTED' ? 'good' : postingStatus === 'FAILED' ? 'bad' : 'neutral'}>
            Posting: {postingStatus || 'UNPOSTED'}
          </Badge>
          <Badge tone={closeStatus === 'CLOSED' ? 'good' : closeStatus === 'OPEN' ? 'warn' : 'neutral'}>
            Close: {closeStatus || 'OPEN'}
          </Badge>

          {reqMissing ? (
            <span className="text-[10px] text-amber-300 ml-2">Select date + branch to enable actions</span>
          ) : null}
        </div>
      </div>

      {actions?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a, idx) => (
            <Button
              key={idx}
              variant={a.variant || 'secondary'}
              icon={a.icon}
              onClick={a.onClick}
              disabled={a.disabled || reqMissing}
            >
              {a.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}