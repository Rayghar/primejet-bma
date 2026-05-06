import React from 'react';
import AdminUtilityPage from './AdminUtilityPage';
import { ADMIN_MODULE_HELP } from '../../utils/helpCatalog';

export default function BackupExportCenter() {
  return <AdminUtilityPage
    title="Backup & Export Center"
    subtitle="Controlled offline data packs for reconciliation, audit, lender review and disaster recovery planning."
    icon="FileText"
    guide={[
      { key: 'purpose', label: 'Purpose', help: ADMIN_MODULE_HELP.backupExport },
      { key: 'privacy', label: 'Privacy', help: 'Exports may contain customer, finance and operational data. Restrict access to authorized users only.' },
      { key: 'control', label: 'Control', help: 'Use export logs to prove who downloaded sensitive reports and when.' },
    ]}
    sections={[
      { title: 'Finance Packs', status: 'Core', tone: 'blue', description: 'Management accounts, GL journals, trial balance and posting exceptions.', items: ['Monthly management pack', 'Trial balance export', 'GL journal export'] },
      { title: 'Operations Packs', status: 'Core', tone: 'green', description: 'Stock, plant profitability, daily close and route/dispatch data.', items: ['Stock ledger export', 'Plant profitability export', 'Daily close export'] },
      { title: 'Audit Packs', status: 'Recommended', tone: 'amber', description: 'Security logs, data migration batches and admin configuration changes.', items: ['User access logs', 'Migration batch evidence', 'Configuration change history'] },
    ]}
    actions={['Open Reports Center', 'Export month-end pack', 'Review download logs']}
  />;
}
