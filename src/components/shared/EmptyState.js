// File: src/components/shared/EmptyState.js
import React from 'react';
import Button from './Button';

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'No records found.',
  icon: Icon,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
      {Icon ? (
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
          <Icon size={22} />
        </div>
      ) : null}

      <div className="text-white font-bold">{title}</div>
      <div className="text-sm text-slate-400 mt-1">{description}</div>

      {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {secondaryLabel && onSecondary ? (
            <Button variant="secondary" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
          {actionLabel && onAction ? (
            <Button onClick={onAction}>{actionLabel}</Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}