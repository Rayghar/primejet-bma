import React from 'react';
import AdminUtilityPage from './AdminUtilityPage';
import { ADMIN_MODULE_HELP } from '../../utils/helpCatalog';

export default function DataQualityCenter() {
  return <AdminUtilityPage
    title="Data Quality Center"
    subtitle="Detect incomplete setup, suspicious operational records and reporting risks before month-end."
    icon="ShieldCheck"
    guide={[
      { key: 'purpose', label: 'Purpose', help: ADMIN_MODULE_HELP.dataQuality },
      { key: 'accounts', label: 'Before Management Accounts', help: 'Run data quality checks before printing P&L, balance sheet, plant profitability or lender reports.' },
      { key: 'exceptions', label: 'Exception Handling', help: 'Fix records at source where possible. Use reversals for posted records and migration exception queues for historical data.' },
    ]}
    sections={[
      { title: 'Setup Completeness', status: 'High Priority', tone: 'amber', description: 'Checks whether branches, products, prices, stock mappings and GL accounts are configured.', items: ['Missing branch pricing', 'Missing stock location', 'Missing GL mappings'] },
      { title: 'Operational Exceptions', status: 'Daily', tone: 'blue', description: 'Checks records that can affect daily close and plant profitability.', items: ['Open daily summaries', 'Meter variance', 'Cash shortage/overage'] },
      { title: 'Finance Exceptions', status: 'Critical', tone: 'red', description: 'Checks whether approved business records are posted cleanly to GL.', items: ['Approved-unposted records', 'Failed postings', 'Unbalanced journals'] },
    ]}
    actions={['Run posting readiness', 'Review daily close control', 'Export exception list']}
  />;
}
