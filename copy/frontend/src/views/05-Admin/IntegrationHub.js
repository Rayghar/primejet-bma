import React from 'react';
import AdminUtilityPage from './AdminUtilityPage';
import { ADMIN_MODULE_HELP } from '../../utils/helpCatalog';

export default function IntegrationHub() {
  return <AdminUtilityPage
    title="Integration Hub"
    subtitle="Central setup and readiness view for external business integrations."
    icon="Link"
    guide={[
      { key: 'purpose', label: 'Purpose', help: ADMIN_MODULE_HELP.integrations },
      { key: 'secrets', label: 'Secret Safety', help: 'Store tokens securely, mask secrets on screen and rotate credentials when access changes.' },
      { key: 'testing', label: 'Test First', help: 'Use dry-run/test modes before switching payment, WhatsApp or messaging integrations to live mode.' },
    ]}
    sections={[
      { title: 'WhatsApp Cloud API', status: 'Active', tone: 'green', description: 'Customer self-service, order intake, conversations and support handoff.', items: ['Phone Number ID', 'Webhook verification', 'Template names and test messages'] },
      { title: 'Payments / Collections', status: 'Planned', tone: 'amber', description: 'Future integration for payment links, bank transfer confirmation and settlement checks.', items: ['Payment link provider', 'Settlement matching', 'Failed payment reconciliation'] },
      { title: 'Accounting Export', status: 'Planned', tone: 'blue', description: 'Future export or integration to external accounting/ERP systems.', items: ['Chart of accounts mapping', 'Journal export', 'Period-close package'] },
    ]}
    actions={['Open WhatsApp settings in System Config', 'Document live credentials', 'Run readiness checks']}
  />;
}
