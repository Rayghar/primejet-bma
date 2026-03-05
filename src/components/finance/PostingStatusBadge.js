// File: src/components/finance/PostingStatusBadge.js
import React from 'react';
import Badge from '../shared/Badge';

const normalize = (s) => String(s || '').toUpperCase();

export default function PostingStatusBadge({ status }) {
  const st = normalize(status);

  if (!st) return <Badge tone="neutral">UNKNOWN</Badge>;

  if (st === 'POSTED') return <Badge tone="good">POSTED</Badge>;
  if (st === 'UNPOSTED') return <Badge tone="warn">UNPOSTED</Badge>;
  if (st === 'QUEUED') return <Badge tone="info">QUEUED</Badge>;
  if (st === 'FAILED') return <Badge tone="bad">FAILED</Badge>;
  if (st === 'SKIPPED') return <Badge tone="neutral">SKIPPED</Badge>;
  if (st === 'REVERSED') return <Badge tone="purple">REVERSED</Badge>;

  return <Badge tone="neutral">{st}</Badge>;
}