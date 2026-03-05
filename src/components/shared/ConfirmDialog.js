// File: src/components/shared/ConfirmDialog.js
import React from 'react';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  description = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger', // 'danger' | 'primary'
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  const confirmVariant = tone === 'danger' ? 'danger' : 'primary';

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0b1224] border border-white/10 shadow-xl">
        <div className="p-5 border-b border-white/10">
          <div className="text-white font-bold">{title}</div>
          <div className="text-sm text-slate-400 mt-1">{description}</div>
        </div>

        <div className="p-5 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}