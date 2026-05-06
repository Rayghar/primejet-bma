import React from 'react';
import AdminUtilityPage from './AdminUtilityPage';
import { ADMIN_MODULE_HELP } from '../../utils/helpCatalog';

export default function ApprovalMatrixAdmin() {
  return <AdminUtilityPage
    title="Approval Matrix"
    subtitle="Configure maker-checker and approval responsibilities for operational, finance and admin actions."
    icon="ClipboardCheck"
    guide={[
      { key: 'purpose', label: 'Purpose', help: ADMIN_MODULE_HELP.approvals },
      { key: 'segregation', label: 'Segregation of Duties', help: 'Use separate request, review and approval roles for reversals, price overrides, stock adjustments and posting-sensitive actions.' },
      { key: 'rollout', label: 'Rollout', help: 'Start with monitoring and approval routing. Enforce maker-checker once your staff roles and operating cadence are stable.' },
    ]}
    sections={[
      { title: 'Cashier / POS Controls', status: 'Recommended', tone: 'blue', description: 'Approval rules for close approval, sale reversal and cash variance exceptions.', items: ['Daily close approval', 'POS reversal approval', 'Cash shortage exception review'] },
      { title: 'Finance Controls', status: 'Critical', tone: 'amber', description: 'Approval rules for GL posting, reopening periods, reversals and opening balances.', items: ['GL reversal review', 'Opening balance posting', 'Month-end lock/reopen'] },
      { title: 'Operations Controls', status: 'Recommended', tone: 'green', description: 'Approval rules for stock variance, plant setup, product price changes and stock adjustment.', items: ['Stock variance approval', 'Price change approval', 'Plant/branch setup changes'] },
    ]}
    actions={['Review current roles', 'Define approval thresholds', 'Enable approval notifications']}
  />;
}
